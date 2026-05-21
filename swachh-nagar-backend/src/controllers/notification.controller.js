const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getAll = asyncHandler(async (req, res) => {
  const result = await notificationService.getForUser(req.user._id, req.query);
  res.json(new ApiResponse(200, result));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.json(new ApiResponse(200, { count }));
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user._id);
  res.json(new ApiResponse(200, notification));
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.json(new ApiResponse(200, null, 'All notifications marked as read'));
});

module.exports = { getAll, getUnreadCount, markRead, markAllRead };
