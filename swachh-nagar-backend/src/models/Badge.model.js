const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    name: { en: { type: String, required: true }, hi: { type: String, required: true } },
    description: { en: String, hi: String },
    icon: { type: String, required: true },
    color: { type: String, default: '#22c55e' },
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    criteria: {
      type: {
        type: String,
        enum: ['complaint_count', 'resolved_count', 'streak_days', 'points_threshold', 'upvotes_received', 'special'],
        required: true,
      },
      threshold: { type: Number, required: true },
    },
    pointReward: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', badgeSchema);
