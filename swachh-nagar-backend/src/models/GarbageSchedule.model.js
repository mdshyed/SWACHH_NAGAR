const mongoose = require('mongoose');

const garbageScheduleSchema = new mongoose.Schema(
  {
    ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    collectionDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    timeSlot: { start: String, end: String },
    vehicleType: { type: String, enum: ['truck', 'auto_rickshaw', 'hand_cart'], default: 'truck' },
    vehicleId: String,
    driverName: String,
    driverPhone: String,
    isActive: { type: Boolean, default: true },
    notes: { en: String, hi: String },
    effectiveFrom: Date,
    effectiveTo: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('GarbageSchedule', garbageScheduleSchema);
