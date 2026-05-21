const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : 500);
    let message = error.message || 'Internal Server Error';

    if (error.name === 'ValidationError') {
      message = Object.values(error.errors).map((e) => e.message).join(', ');
    } else if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    error = new ApiError(statusCode, message, [], err.stack);
  }

  logger.error({
    message: error.message,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  });

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
  });
};

module.exports = errorHandler;
