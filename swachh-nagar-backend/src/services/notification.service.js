const Notification = require('../models/Notification.model');
const { getIO } = require('../config/socket');
const logger = require('../config/logger');

const send = async ({ recipient, type, title, body, data = {}, reference }) => {
  const notification = await Notification.create({ recipient, type, title, body, data, reference });

  try {
    const io = getIO();
    io.to(`user:${recipient.toString()}`).emit('notification', {
      _id: notification._id,
      type,
      title,
      body,
      data,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    logger.warn(`Socket emit failed for notification: ${err.message}`);
  }

  return notification;
};

const getForUser = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ recipient: userId }),
  ]);
  return { notifications, total };
};

const getUnreadCount = (userId) =>
  Notification.countDocuments({ recipient: userId, isRead: false });

const markRead = (notificationId, userId) =>
  Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

const markAllRead = (userId) =>
  Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true, readAt: new Date() });

module.exports = { send, getForUser, getUnreadCount, markRead, markAllRead };
