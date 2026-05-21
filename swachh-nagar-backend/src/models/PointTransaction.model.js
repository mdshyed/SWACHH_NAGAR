const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  points: { type: Number, required: true },
  action: {
    type: String,
    enum: ['complaint_submitted', 'complaint_resolved', 'complaint_upvoted', 'badge_earned', 'profile_completed', 'daily_login', 'blog_published', 'admin_bonus', 'penalty'],
    required: true,
  },
  reference: {
    model: { type: String, enum: ['Complaint', 'Badge', 'Blog'] },
    id: mongoose.Schema.Types.ObjectId,
  },
  description: String,
  balance: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

pointTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
