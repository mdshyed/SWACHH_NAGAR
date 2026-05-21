const mongoose = require('mongoose');
const COMPLAINT_CATEGORIES = require('../constants/categories');
const { COMPLAINT_STATUS } = require('../constants/complaintStatus');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { type: String, enum: ['before', 'after'], default: 'before' },
  uploadedAt: { type: Date, default: Date.now },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment: String,
  timestamp: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true },
    title: { type: String, required: true, trim: true, minlength: 10, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 1000 },
    category: { type: String, enum: COMPLAINT_CATEGORIES, required: true },
    status: {
      type: String,
      enum: [...Object.values(COMPLAINT_STATUS), 'escalated'],
      default: COMPLAINT_STATUS.PENDING,
      index: true,
    },
    escalatedAt: { type: Date, default: null },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: String,
      landmark: String,
      pincode: String,
    },
    images: [imageSchema],
    aiValidation: {
      isValidated: { type: Boolean, default: false },
      confidence: Number,
      detectedClass: String,
      rawScores: mongoose.Schema.Types.Mixed,
      validatedAt: Date,
    },
    statusHistory: [statusHistorySchema],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },
    adminNote: String,
    resolutionNote: String,
    rejectionReason: String,
    isAnonymous: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    resolvedAt: Date,
    slaDeadline: { type: Date, index: true },
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvoteCount: { type: Number, default: 0 },
    isSuspicious: { type: Boolean, default: false, index: true },
    // Clustering
    clusterParent: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null, index: true },
    clusterCount: { type: Number, default: 1 },
    // Reopen
    reopenCount: { type: Number, default: 0 },
    reopenedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ reporter: 1, createdAt: -1 });
complaintSchema.index({ ward: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ slaDeadline: 1, status: 1 });

complaintSchema.pre('save', function (next) {
  if (this.isNew) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.complaintId = `SN-${dateStr}-${rand}`;
    this.slaDeadline = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    this.statusHistory.push({
      status: this.status,
      comment: 'Complaint submitted',
      timestamp: date,
    });
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
