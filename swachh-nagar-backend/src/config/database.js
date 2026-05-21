const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

const connect = async (retries = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (retries === 0) {
      logger.error('MongoDB connection failed after max retries. Exiting.');
      process.exit(1);
    }
    logger.warn(`MongoDB connection failed. Retrying in ${RETRY_INTERVAL_MS / 1000}s... (${retries} retries left)`);
    await new Promise((res) => setTimeout(res, RETRY_INTERVAL_MS));
    return connect(retries - 1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

module.exports = { connect };
