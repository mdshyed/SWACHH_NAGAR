const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  res.status(201).json(new ApiResponse(201, { user: result.user, accessToken: result.accessToken }, 'Account created successfully'));
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  res.json(new ApiResponse(200, { user: result.user, accessToken: result.accessToken }, 'Login successful'));
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken');
  res.json(new ApiResponse(200, null, 'Logged out successfully'));
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refreshTokens(token);
  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  res.json(new ApiResponse(200, { accessToken: result.accessToken }, 'Token refreshed'));
});

const getMe = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, req.user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  res.json(new ApiResponse(200, result, result.message));
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.json(new ApiResponse(200, null, result.message));
});

module.exports = { register, login, logout, refreshToken, getMe, forgotPassword, resetPassword };
