const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const uploadImage = async (buffer, folder = 'complaints') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `swachh-nagar/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'webp', width: 1280, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(new ApiError(500, `Image upload failed: ${error.message}`));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.warn(`Failed to delete image ${publicId}: ${err.message}`);
  }
};

const deleteImages = async (publicIds) => {
  await Promise.allSettled(publicIds.map(deleteImage));
};

module.exports = { uploadImage, deleteImage, deleteImages };
