const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['complaint_status_changed', 'complaint_assigned', 'badge_earned', 'points_awarded', 'upvote_received', 'admin_message', 'schedule_reminder', 'system'],
    required: true,
  },
  title: { en: String, hi: String },
  body: { en: String, hi: String },
  data: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
  reference: {
    model: String,
    id: mongoose.Schema.Types.ObjectId,
  },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 }, // TTL: 90 days
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
