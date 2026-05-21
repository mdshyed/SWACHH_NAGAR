const complaintService = require('../services/complaint.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const complaint = await complaintService.create({ body: req.body, files: req.files, user: req.user });
  res.status(201).json(new ApiResponse(201, complaint, 'Complaint submitted successfully'));
});

const getAll = asyncHandler(async (req, res) => {
  const { status, category, ward, search } = req.query;
  const result = await complaintService.getAll({ status, category, ward, search }, req.query);
  res.json(new ApiResponse(200, result));
});

const getMine = asyncHandler(async (req, res) => {
  const result = await complaintService.getAll({ reporter: req.user._id }, req.query);
  res.json(new ApiResponse(200, result));
});

const getById = asyncHandler(async (req, res) => {
  const complaint = await complaintService.getById(req.params.id);
  res.json(new ApiResponse(200, complaint));
});

const getMapData = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const geoJSON = await complaintService.getMapData({ status, category });
  res.json(new ApiResponse(200, geoJSON));
});

const upvote = asyncHandler(async (req, res) => {
  const result = await complaintService.toggleUpvote(req.params.id, req.user._id);
  res.json(new ApiResponse(200, result));
});

const remove = asyncHandler(async (req, res) => {
  await complaintService.softDelete(req.params.id, req.user._id);
  res.json(new ApiResponse(200, null, 'Complaint deleted'));
});

const adminRemove = asyncHandler(async (req, res) => {
  await complaintService.adminDelete(req.params.id);
  res.json(new ApiResponse(200, null, 'Complaint deleted by admin'));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, comment, resolutionNote, rejectionReason } = req.body;
  const complaint = await complaintService.updateStatus({
    complaintId: req.params.id,
    newStatus: status,
    changedBy: req.user._id,
    comment,
    resolutionNote,
    rejectionReason,
  });
  res.json(new ApiResponse(200, complaint, 'Status updated'));
});

const getTimeline = asyncHandler(async (req, res) => {
  const complaint = await complaintService.getById(req.params.id);
  res.json(new ApiResponse(200, complaint.statusHistory));
});

const getHeatmapData = asyncHandler(async (req, res) => {
  const data = await complaintService.getHeatmapData();
  res.json(new ApiResponse(200, data));
});

const castVote = asyncHandler(async (req, res) => {
  const { voteType } = req.body;
  if (!['up', 'down'].includes(voteType)) throw new Error('voteType must be "up" or "down"');
  const result = await complaintService.vote(req.params.id, req.user._id, voteType);
  res.json(new ApiResponse(200, result));
});

const uploadAfterImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No image file provided');
  const result = await complaintService.uploadAfterImage(req.params.id, req.file);
  res.json(new ApiResponse(200, result, 'After image uploaded'));
});

const reopenComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.reopen(req.params.id, req.user._id, req.user.role === 'admin' || req.user.role === 'super_admin');
  res.json(new ApiResponse(200, complaint, 'Complaint reopened'));
});

const getNearby = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) throw new Error('lat and lng are required');
  const data = await complaintService.getNearby({ lat, lng, radius, excludeId: req.query.exclude });
  res.json(new ApiResponse(200, data));
});

module.exports = { create, getAll, getMine, getById, getMapData, getHeatmapData, upvote, castVote, uploadAfterImage, remove, adminRemove, updateStatus, getTimeline, reopenComplaint, getNearby };
