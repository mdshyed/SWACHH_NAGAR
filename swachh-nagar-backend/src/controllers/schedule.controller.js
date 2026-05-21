const GarbageSchedule = require('../models/GarbageSchedule.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getAll = asyncHandler(async (_req, res) => {
  const schedules = await GarbageSchedule.find({ isActive: true }).populate('ward', 'wardName wardNumber');
  res.json(new ApiResponse(200, schedules));
});

const getByWard = asyncHandler(async (req, res) => {
  const schedules = await GarbageSchedule.find({ ward: req.params.wardId, isActive: true });
  if (!schedules.length) throw new ApiError(404, 'No schedule found for this ward');
  res.json(new ApiResponse(200, schedules));
});

const getToday = asyncHandler(async (_req, res) => {
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  const schedules = await GarbageSchedule.find({ collectionDays: dayName, isActive: true })
    .populate('ward', 'wardName wardNumber');
  res.json(new ApiResponse(200, schedules));
});

const create = asyncHandler(async (req, res) => {
  const schedule = await GarbageSchedule.create(req.body);
  res.status(201).json(new ApiResponse(201, schedule, 'Schedule created'));
});

const update = asyncHandler(async (req, res) => {
  const schedule = await GarbageSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  res.json(new ApiResponse(200, schedule, 'Schedule updated'));
});

const remove = asyncHandler(async (req, res) => {
  await GarbageSchedule.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json(new ApiResponse(200, null, 'Schedule deactivated'));
});

module.exports = { getAll, getByWard, getToday, create, update, remove };
