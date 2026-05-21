const User = require('../models/User.model');
const { uploadImage } = require('../services/image.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const ROLES = require('../constants/roles');
const { paginate, paginatedResponse } = require('../utils/pagination');

const getProfile = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, req.user));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, language } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone, language }, { new: true, runValidators: true });
  res.json(new ApiResponse(200, user, 'Profile updated'));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image provided');
  const { url, publicId } = await uploadImage(req.file.buffer, 'avatars');
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: { url, publicId } }, { new: true });
  res.json(new ApiResponse(200, user, 'Avatar updated'));
});

// Admin controllers
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [users, total] = await Promise.all([
    User.find().select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  res.json(new ApiResponse(200, paginatedResponse(users, total, page, limit)));
});

const banUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: !req.body.isBanned }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, user, `User ${user.isBanned ? 'banned' : 'unbanned'}`));
});

const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const allowed = [ROLES.USER, ROLES.ADMIN];
  if (!allowed.includes(role)) throw new ApiError(400, `Role must be one of: ${allowed.join(', ')}`);
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, 'Cannot change your own role');
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash -refreshTokenHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, user, `Role updated to ${role}`));
});

module.exports = { getProfile, updateProfile, uploadAvatar, getAllUsers, banUser, updateRole };
