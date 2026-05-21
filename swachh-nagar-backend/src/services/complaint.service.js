const Complaint = require('../models/Complaint.model');
const { uploadImage, deleteImages } = require('./image.service');
const gamificationService = require('./gamification.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const { COMPLAINT_STATUS, STATUS_TRANSITIONS } = require('../constants/complaintStatus');
const { paginate, paginatedResponse } = require('../utils/pagination');
const { getIO } = require('../config/socket');
const { MAP_ROOM } = require('../sockets');
const logger = require('../config/logger');

const CLUSTER_RADIUS_METERS = 150;

const create = async ({ body, files, user }) => {
  const { title, description, category, location, isAnonymous, ward } = body;
  const lng = parseFloat(location.lng);
  const lat = parseFloat(location.lat);

  // --- Clustering: find a nearby active complaint of the same category ---
  const clusterParentDoc = await Complaint.findOne({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: CLUSTER_RADIUS_METERS,
      },
    },
    category,
    status: { $nin: ['resolved', 'rejected'] },
    isDeleted: false,
    clusterParent: null, // only cluster into root parents
  });

  const complaint = new Complaint({
    title,
    description,
    category,
    location: { type: 'Point', coordinates: [lng, lat], address: location.address, landmark: location.landmark, pincode: location.pincode },
    reporter: user._id,
    isAnonymous: isAnonymous || false,
    ...(ward ? { ward } : {}),
    ...(clusterParentDoc ? { clusterParent: clusterParentDoc._id } : {}),
  });

  if (files && files.length > 0) {
    const uploadedImages = await Promise.all(files.map((f) => uploadImage(f.buffer, 'complaints')));
    complaint.images = uploadedImages.map((img) => ({ ...img, type: 'before' }));
  }

  await complaint.save();
  await gamificationService.awardPoints(user._id, 'complaint_submitted', 'Complaint', complaint._id);

  // If merged into a cluster, increment parent count and skip emitting a new map marker
  if (clusterParentDoc) {
    await Complaint.findByIdAndUpdate(clusterParentDoc._id, { $inc: { clusterCount: 1 } });
    try {
      const io = getIO();
      io.to(MAP_ROOM).emit('cluster:updated', { id: clusterParentDoc._id, clusterCount: clusterParentDoc.clusterCount + 1 });
    } catch {}
    return complaint.populate('reporter', 'name avatar');
  }

  const populated = await complaint.populate('reporter', 'name avatar');

  // Broadcast new standalone complaint to map viewers
  try {
    const io = getIO();
    io.to(MAP_ROOM).emit('complaint:created', {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: populated.location.coordinates },
      properties: {
        id: populated._id,
        complaintId: populated.complaintId,
        status: populated.status,
        category: populated.category,
        title: populated.title,
        createdAt: populated.createdAt,
        clusterCount: 1,
      },
    });
  } catch (err) {
    logger.warn(`Socket emit (complaint:created) failed: ${err.message}`);
  }

  return populated;
};

const getAll = async (filters = {}, queryParams = {}) => {
  const { page, limit, skip } = paginate(queryParams);
  const query = { isDeleted: false };

  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.ward) query.ward = filters.ward;
  if (filters.reporter) query.reporter = filters.reporter;
  if (filters.search) query.$text = { $search: filters.search };

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('reporter', 'name avatar')
      .populate('assignedTo', 'name')
      .sort(queryParams.sort === 'urgency' ? { slaDeadline: 1, priority: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(query),
  ]);

  return paginatedResponse(complaints, total, page, limit);
};

const getById = async (id) => {
  const complaint = await Complaint.findOne({ _id: id, isDeleted: false })
    .populate('reporter', 'name avatar email')
    .populate('assignedTo', 'name email')
    .populate('ward')
    .populate('statusHistory.changedBy', 'name');

  if (!complaint) throw new ApiError(404, 'Complaint not found');
  return complaint;
};

const updateStatus = async ({ complaintId, newStatus, changedBy, comment, resolutionNote, rejectionReason }) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const allowed = STATUS_TRANSITIONS[complaint.status];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Cannot transition from ${complaint.status} to ${newStatus}`);
  }

  const previousStatus = complaint.status;
  complaint.status = newStatus;
  complaint.statusHistory.push({ status: newStatus, changedBy, comment: comment || '', timestamp: new Date() });

  if (newStatus === COMPLAINT_STATUS.RESOLVED) {
    complaint.resolvedAt = new Date();
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    await gamificationService.awardPoints(complaint.reporter, 'complaint_resolved', 'Complaint', complaint._id);
  }
  if (newStatus === COMPLAINT_STATUS.REJECTED && rejectionReason) {
    complaint.rejectionReason = rejectionReason;
  }

  await complaint.save();

  await notificationService.send({
    recipient: complaint.reporter,
    type: 'complaint_status_changed',
    title: { en: `Complaint ${complaint.complaintId} Updated`, hi: `शिकायत ${complaint.complaintId} अपडेट हुई` },
    body: { en: `Status changed from ${previousStatus} to ${newStatus}`, hi: `स्थिति बदली: ${previousStatus} → ${newStatus}` },
    data: { complaintId: complaint._id, previousStatus, newStatus },
    reference: { model: 'Complaint', id: complaint._id },
  });

  try {
    const io = getIO();
    // Broadcast status change to all map viewers
    io.to(MAP_ROOM).emit('complaint:updated', { id: complaint._id, status: newStatus });
    // Also notify ward room
    if (complaint.ward) io.to(`ward:${complaint.ward}`).emit('complaint:updated', { id: complaint._id, status: newStatus });
    // Notify the reporter's personal room directly
    io.to(`user:${complaint.reporter.toString()}`).emit('complaint:status_changed', {
      complaintId: complaint._id,
      complaintRef: complaint.complaintId,
      previousStatus,
      newStatus,
    });
  } catch (err) {
    logger.warn(`Socket emit failed: ${err.message}`);
  }

  return complaint;
};

const toggleUpvote = async (complaintId, userId) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const idx = complaint.upvotes.indexOf(userId);
  if (idx === -1) {
    complaint.upvotes.push(userId);
    complaint.upvoteCount += 1;
    await gamificationService.awardPoints(complaint.reporter, 'complaint_upvoted', 'Complaint', complaint._id);
  } else {
    complaint.upvotes.splice(idx, 1);
    complaint.upvoteCount -= 1;
  }

  await complaint.save();
  return { upvoteCount: complaint.upvoteCount, upvoted: idx === -1 };
};

const getMapData = async (filters = {}) => {
  const query = { isDeleted: false, clusterParent: null }; // only show cluster roots
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;

  const complaints = await Complaint.find(query)
    .select('location status category complaintId title createdAt clusterCount')
    .limit(500);

  return {
    type: 'FeatureCollection',
    features: complaints.map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: c.location.coordinates },
      properties: {
        id: c._id, complaintId: c.complaintId, status: c.status,
        category: c.category, title: c.title, createdAt: c.createdAt,
        clusterCount: c.clusterCount || 1,
      },
    })),
  };
};

const getNearby = async ({ lat, lng, radius = 1000, excludeId }) => {
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius),
      },
    },
    isDeleted: false,
    status: { $nin: ['resolved', 'rejected'] },
  };
  if (excludeId) query._id = { $ne: excludeId };

  return Complaint.find(query)
    .select('title category status location complaintId clusterCount createdAt')
    .limit(8);
};

const reopen = async (complaintId, userId, isAdmin) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  if (complaint.status !== 'resolved') throw new ApiError(400, 'Only resolved complaints can be reopened');

  // Only the reporter or an admin can reopen
  if (!isAdmin && complaint.reporter.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the reporter or an admin can reopen this complaint');
  }

  complaint.status = 'pending';
  complaint.reopenCount = (complaint.reopenCount || 0) + 1;
  complaint.reopenedAt = new Date();
  complaint.resolvedAt = null;
  complaint.statusHistory.push({
    status: 'pending',
    changedBy: userId,
    comment: `Reopened by ${isAdmin ? 'admin' : 'reporter'} (reopen #${complaint.reopenCount})`,
    timestamp: new Date(),
  });

  await complaint.save();

  try {
    const io = getIO();
    io.to(MAP_ROOM).emit('complaint:updated', { id: complaint._id, status: 'pending' });
    io.to(`user:${complaint.reporter.toString()}`).emit('complaint:status_changed', {
      complaintId: complaint._id,
      complaintRef: complaint.complaintId,
      previousStatus: 'resolved',
      newStatus: 'pending',
    });
  } catch {}

  return complaint;
};

const softDelete = async (complaintId, userId) => {
  const complaint = await Complaint.findOne({ _id: complaintId, reporter: userId, isDeleted: false });
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  if (complaint.status !== COMPLAINT_STATUS.PENDING) {
    throw new ApiError(400, 'Only pending complaints can be deleted');
  }
  complaint.isDeleted = true;
  await complaint.save();
  if (complaint.images.length > 0) {
    await deleteImages(complaint.images.map((i) => i.publicId));
  }
};

const adminDelete = async (complaintId) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  complaint.isDeleted = true;
  await complaint.save();
  if (complaint.images.length > 0) {
    await deleteImages(complaint.images.map((i) => i.publicId)).catch(() => {});
  }
};

const getHeatmapData = async () => {
  const complaints = await Complaint.find({ isDeleted: false, status: { $nin: ['resolved', 'rejected'] } })
    .select('location priority upvoteCount')
    .limit(1000);

  return complaints
    .filter((c) => c.location?.coordinates?.length === 2)
    .map((c) => ({
      lat: c.location.coordinates[1],
      lng: c.location.coordinates[0],
      weight: { critical: 4, high: 3, medium: 2, low: 1 }[c.priority] || 1,
    }));
};

const vote = async (complaintId, userId, voteType) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const uid = userId.toString();
  const hadUpvoted = complaint.upvotes.some((id) => id.toString() === uid);
  const hadDownvoted = complaint.downvotes.some((id) => id.toString() === uid);

  if (hadUpvoted) {
    complaint.upvotes = complaint.upvotes.filter((id) => id.toString() !== uid);
    complaint.upvoteCount = Math.max(0, complaint.upvoteCount - 1);
  }
  if (hadDownvoted) {
    complaint.downvotes = complaint.downvotes.filter((id) => id.toString() !== uid);
    complaint.downvoteCount = Math.max(0, complaint.downvoteCount - 1);
  }

  let userVote = 'none';
  if (voteType === 'up' && !hadUpvoted) {
    complaint.upvotes.push(userId);
    complaint.upvoteCount += 1;
    userVote = 'up';
  } else if (voteType === 'down' && !hadDownvoted) {
    complaint.downvotes.push(userId);
    complaint.downvoteCount += 1;
    userVote = 'down';
  }

  const net = complaint.upvoteCount - complaint.downvoteCount;
  if (net >= 10) complaint.priority = 'critical';
  else if (net >= 5) complaint.priority = 'high';
  else if (net >= 2) complaint.priority = 'medium';
  complaint.isSuspicious = complaint.downvoteCount >= 3 && net < 0;

  await complaint.save();

  return {
    upvoteCount: complaint.upvoteCount,
    downvoteCount: complaint.downvoteCount,
    isSuspicious: complaint.isSuspicious,
    priority: complaint.priority,
    userVote,
  };
};

const uploadAfterImage = async (complaintId, file) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const existing = complaint.images.find((img) => img.type === 'after');
  if (existing) {
    await deleteImages([existing.publicId]).catch(() => {});
    complaint.images = complaint.images.filter((img) => img.type !== 'after');
  }

  const { url, publicId } = await uploadImage(file.buffer, 'complaints');
  complaint.images.push({ url, publicId, type: 'after' });
  await complaint.save();

  return { url, publicId, type: 'after' };
};

module.exports = { create, getAll, getById, updateStatus, toggleUpvote, vote, getMapData, getHeatmapData, uploadAfterImage, softDelete, adminDelete, reopen, getNearby };
