const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const verifyConnection = async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'placeholder') {
    logger.warn('Cloudinary not configured — image uploads will be disabled');
    return;
  }
  try {
    await cloudinary.api.ping();
    logger.info('Cloudinary connected successfully');
  } catch (err) {
    logger.warn(`Cloudinary connection failed: ${err.message}`);
  }
};

module.exports = { cloudinary, verifyConnection };
