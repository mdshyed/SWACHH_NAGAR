const gamificationService = require('../services/gamification.service');
const Badge = require('../models/Badge.model');
const UserBadge = require('../models/UserBadge.model');
const PointTransaction = require('../models/PointTransaction.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { paginate, paginatedResponse } = require('../utils/pagination');

const getLeaderboard = asyncHandler(async (req, res) => {
  const { period = 'all_time' } = req.params;
  const users = await gamificationService.getLeaderboard(period);
  const ranked = users.map((u, i) => ({ rank: i + 1, ...u.toObject() }));
  res.json(new ApiResponse(200, ranked));
});

const getAllBadges = asyncHandler(async (req, res) => {
  const badges = await Badge.find({ isActive: true }).sort({ sortOrder: 1 });
  res.json(new ApiResponse(200, badges));
});

const getMyBadges = asyncHandler(async (req, res) => {
  const earned = await UserBadge.find({ user: req.user._id }).populate('badge');
  res.json(new ApiResponse(200, earned));
});

const getPointsHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [transactions, total] = await Promise.all([
    PointTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PointTransaction.countDocuments({ user: req.user._id }),
  ]);
  res.json(new ApiResponse(200, paginatedResponse(transactions, total, page, limit)));
});

const createBadge = asyncHandler(async (req, res) => {
  const badge = await Badge.create(req.body);
  res.status(201).json(new ApiResponse(201, badge, 'Badge created'));
});

const awardPoints = asyncHandler(async (req, res) => {
  const { userId, points, description } = req.body;
  const tx = await gamificationService.awardPoints(userId, 'admin_bonus', null, null, points);
  res.json(new ApiResponse(200, tx, 'Points awarded'));
});

module.exports = { getLeaderboard, getAllBadges, getMyBadges, getPointsHistory, createBadge, awardPoints };
