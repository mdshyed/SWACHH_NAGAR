const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ROLES = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, sparse: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    avatar: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    address: {
      street: String,
      ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
      city: { type: String, default: 'Mumbai' },
      pincode: String,
    },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    points: { type: Number, default: 0, index: true },
    level: { type: Number, default: 1 },
    refreshTokenHash: { type: String, select: false },
    fcmToken: { type: String, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ points: -1 });
userSchema.index({ role: 1, isActive: 1 });

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.fcmToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
