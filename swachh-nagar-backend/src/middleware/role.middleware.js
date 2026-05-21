const ApiError = require('../utils/ApiError');

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
  next();
};

module.exports = requireRole;
