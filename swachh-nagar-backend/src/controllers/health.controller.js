const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

const liveness = asyncHandler(async (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const readiness = asyncHandler(async (_req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const ready = dbState === 'connected';
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not ready', db: dbState });
});

module.exports = { liveness, readiness };
