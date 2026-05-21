const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema(
  {
    wardNumber: { type: Number, unique: true, required: true },
    wardName: { en: { type: String, required: true }, hi: String },
    city: { type: String, default: 'Mumbai' },
    zone: String,
    boundary: {
      type: { type: String, enum: ['Polygon'] },
      coordinates: { type: [[[Number]]] },
    },
    population: Number,
    area: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

wardSchema.index({ boundary: '2dsphere' });

module.exports = mongoose.model('Ward', wardSchema);
