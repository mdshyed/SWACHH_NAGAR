const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ROLES = require('../constants/roles');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, compareToken } = require('./token.service');
const { sendPasswordResetEmail } = require('../utils/email');

const register = async ({ name, email, password, adminCode }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
  const inviteCode = process.env.ADMIN_INVITE_CODE;
  const role = (inviteCode && adminCode && adminCode === inviteCode) ? ROLES.ADMIN : ROLES.USER;
  const user = await User.create({ name, email, passwordHash, role });

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHash');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (user.isBanned) throw new ApiError(403, 'Account suspended');
  if (!user.isActive) throw new ApiError(403, 'Account deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = await hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

const refreshTokens = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw new ApiError(401, 'Session not found');

  const isValid = await compareToken(refreshToken, user.refreshTokenHash);
  if (!isValid) throw new ApiError(401, 'Refresh token mismatch');

  const newAccessToken = signAccessToken(user._id, user.role);
  const newRefreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = await hashToken(newRefreshToken);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
};

const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) return { message: 'If that email is registered, a reset link has been sent.' };

  // Token secret includes current passwordHash — auto-invalidates once password changes
  const secret = process.env.JWT_ACCESS_SECRET + user.passwordHash;
  const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await sendPasswordResetEmail({ to: user.email, resetLink });

  return { message: 'If that email is registered, a reset link has been sent.' };
};

const resetPassword = async ({ token, newPassword }) => {
  let decoded;
  try { decoded = jwt.decode(token); } catch { throw new ApiError(400, 'Invalid reset token.'); }
  if (!decoded?.userId) throw new ApiError(400, 'Invalid reset token.');

  const user = await User.findById(decoded.userId).select('+passwordHash');
  if (!user) throw new ApiError(400, 'Invalid reset token.');

  const secret = process.env.JWT_ACCESS_SECRET + user.passwordHash;
  try { jwt.verify(token, secret); } catch { throw new ApiError(400, 'Reset link has expired or already been used.'); }

  user.passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
  await user.save();
  return { message: 'Password reset successfully. You can now log in.' };
};

module.exports = { register, login, refreshTokens, logout, forgotPassword, resetPassword };
