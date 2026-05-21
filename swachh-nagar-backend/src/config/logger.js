const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    new transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? combine(json())
          : combine(colorize(), devFormat),
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: combine(json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: combine(json()),
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

module.exports = logger;
