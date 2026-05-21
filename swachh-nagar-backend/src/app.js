require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

const requestId = require('./middleware/requestId.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const ApiError = require('./utils/ApiError');
const logger = require('./config/logger');

const app = express();

// Security
app.use(helmet());
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/.*\.vercel\.app$/,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Rate limiting — disabled in development
const isDev = process.env.NODE_ENV !== 'production';

app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { success: false, message: 'Too many requests, please try again later' },
}));

app.use('/api/v1/auth', rateLimit({
  windowMs: 900000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  skip: () => isDev,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
}));

// Per-user complaint creation limit: 10 per hour
app.use('/api/v1/complaints', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skip: (req) => isDev || req.method !== 'POST',
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Too many complaints submitted. Please wait before submitting again.' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitization
app.use(mongoSanitize());

// Request ID + logging
app.use(requestId);
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// Routes
app.use('/api/v1', require('./routes/index'));

// 404 handler
app.use((_req, _res, next) => next(new ApiError(404, 'Route not found')));

// Global error handler
app.use(errorHandler);

module.exports = app;
