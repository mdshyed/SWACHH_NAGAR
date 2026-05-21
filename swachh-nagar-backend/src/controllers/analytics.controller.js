const Complaint = require('../models/Complaint.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getOverview = asyncHandler(async (_req, res) => {
  const [total, resolved, pending, inProgress, rejected, totalUsers] = await Promise.all([
    Complaint.countDocuments({ isDeleted: false }),
    Complaint.countDocuments({ status: 'resolved', isDeleted: false }),
    Complaint.countDocuments({ status: 'pending', isDeleted: false }),
    Complaint.countDocuments({ status: 'in_progress', isDeleted: false }),
    Complaint.countDocuments({ status: 'rejected', isDeleted: false }),
    User.countDocuments({ isActive: true }),
  ]);

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  res.json(new ApiResponse(200, { total, resolved, pending, inProgress, rejected, resolutionRate, totalUsers }));
});

const getTrends = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await Complaint.aggregate([
    { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json(new ApiResponse(200, data));
});

const byCategory = asyncHandler(async (_req, res) => {
  const data = await Complaint.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json(new ApiResponse(200, data));
});

const byStatus = asyncHandler(async (_req, res) => {
  const data = await Complaint.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  res.json(new ApiResponse(200, data));
});

const byWard = asyncHandler(async (_req, res) => {
  const data = await Complaint.aggregate([
    { $match: { isDeleted: false, ward: { $exists: true } } },
    { $group: { _id: '$ward', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
    { $lookup: { from: 'wards', localField: '_id', foreignField: '_id', as: 'ward' } },
    { $unwind: { path: '$ward', preserveNullAndEmptyArrays: true } },
    { $sort: { total: -1 } },
  ]);
  res.json(new ApiResponse(200, data));
});

const getHeatmap = asyncHandler(async (_req, res) => {
  const complaints = await Complaint.find({ isDeleted: false }).select('location.coordinates status');
  const points = complaints.map((c) => ({ lat: c.location.coordinates[1], lng: c.location.coordinates[0], weight: 1 }));
  res.json(new ApiResponse(200, points));
});

// Public endpoint — no auth required
const getPublicStats = asyncHandler(async (_req, res) => {
  const [total, resolved, pending, inProgress, escalated, byCategory, topProblematic, topClean] = await Promise.all([
    Complaint.countDocuments({ isDeleted: false }),
    Complaint.countDocuments({ status: 'resolved', isDeleted: false }),
    Complaint.countDocuments({ status: 'pending', isDeleted: false }),
    Complaint.countDocuments({ status: 'in_progress', isDeleted: false }),
    Complaint.countDocuments({ status: 'escalated', isDeleted: false }),
    Complaint.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    // Top 5 wards with most unresolved complaints
    Complaint.aggregate([
      { $match: { isDeleted: false, status: { $nin: ['resolved', 'rejected'] }, ward: { $exists: true, $ne: null } } },
      { $group: { _id: '$ward', unresolved: { $sum: 1 } } },
      { $sort: { unresolved: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'wards', localField: '_id', foreignField: '_id', as: 'ward' } },
      { $unwind: { path: '$ward', preserveNullAndEmptyArrays: true } },
    ]),
    // Top 5 wards with best resolution rate
    Complaint.aggregate([
      { $match: { isDeleted: false, ward: { $exists: true, $ne: null } } },
      { $group: {
        _id: '$ward',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      }},
      { $match: { total: { $gte: 3 } } },
      { $addFields: { rate: { $divide: ['$resolved', '$total'] } } },
      { $sort: { rate: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'wards', localField: '_id', foreignField: '_id', as: 'ward' } },
      { $unwind: { path: '$ward', preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  res.json(new ApiResponse(200, {
    total, resolved, pending, inProgress, escalated, resolutionRate,
    byCategory,
    topProblematic: topProblematic.map((w) => ({
      wardName: w.ward?.wardName?.en || `Ward ${w._id}`,
      unresolved: w.unresolved,
    })),
    topClean: topClean.map((w) => ({
      wardName: w.ward?.wardName?.en || `Ward ${w._id}`,
      rate: Math.round(w.rate * 100),
      total: w.total,
    })),
  }));
});

const getAdminPerformance = asyncHandler(async (_req, res) => {
  const now = new Date();

  const rows = await Complaint.aggregate([
    { $match: { isDeleted: false, assignedTo: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$assignedTo',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$slaDeadline', now] },
                  { $not: { $in: ['$status', ['resolved', 'rejected', 'escalated']] } },
                ],
              },
              1, 0,
            ],
          },
        },
        avgResolutionMs: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$resolvedAt', null] }, { $ne: ['$createdAt', null] }] },
              { $subtract: ['$resolvedAt', '$createdAt'] },
              null,
            ],
          },
        },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'admin' } },
    { $unwind: { path: '$admin', preserveNullAndEmptyArrays: true } },
    { $sort: { resolved: -1 } },
    {
      $project: {
        adminId: '$_id',
        name: '$admin.name',
        email: '$admin.email',
        total: 1,
        resolved: 1,
        overdue: 1,
        resolutionRate: {
          $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 0],
        },
        avgResolutionHours: {
          $cond: [
            { $ne: ['$avgResolutionMs', null] },
            { $round: [{ $divide: ['$avgResolutionMs', 3600000] }, 1] },
            null,
          ],
        },
      },
    },
  ]);

  res.json(new ApiResponse(200, rows));
});

module.exports = { getOverview, getTrends, byCategory, byStatus, byWard, getHeatmap, getPublicStats, getAdminPerformance };
