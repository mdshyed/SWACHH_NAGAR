const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token required');
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
  }

  const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokenHash');
  if (!user || !user.isActive || user.isBanned) {
    throw new ApiError(401, 'Account not found or suspended');
  }

  req.user = user;
  next();
});

module.exports = authenticate;
