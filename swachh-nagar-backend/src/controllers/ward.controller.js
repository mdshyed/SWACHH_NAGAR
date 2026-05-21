const Ward = require('../models/Ward.model');
const Complaint = require('../models/Complaint.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getAll = asyncHandler(async (_req, res) => {
  const wards = await Ward.find({ isActive: true }).sort({ wardNumber: 1 }).select('wardNumber wardName zone city');
  res.json(new ApiResponse(200, wards));
});

const getStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [ward, stats] = await Promise.all([
    Ward.findById(id),
    Complaint.aggregate([
      { $match: { ward: require('mongoose').Types.ObjectId.createFromHexString(id), isDeleted: false } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
      }},
    ]),
  ]);
  if (!ward) return res.status(404).json(new ApiResponse(404, null, 'Ward not found'));
  const statusMap = Object.fromEntries(stats.map((s) => [s._id, s.count]));
  res.json(new ApiResponse(200, { ward, stats: statusMap }));
});

// Seed a default set of Mumbai wards if the collection is empty
const seed = asyncHandler(async (_req, res) => {
  const existing = await Ward.countDocuments();
  if (existing > 0) return res.json(new ApiResponse(200, null, `${existing} wards already exist`));

  const wards = Array.from({ length: 10 }, (_, i) => ({
    wardNumber: i + 1,
    wardName: { en: `Ward ${i + 1}`, hi: `वार्ड ${i + 1}` },
    city: 'Mumbai',
    zone: ['A', 'B', 'C', 'D', 'E', 'F/N', 'F/S', 'G/N', 'G/S', 'H/E'][i],
    isActive: true,
  }));

  const created = await Ward.insertMany(wards);
  res.json(new ApiResponse(201, created, '10 default wards seeded'));
});

module.exports = { getAll, getStats, seed };
