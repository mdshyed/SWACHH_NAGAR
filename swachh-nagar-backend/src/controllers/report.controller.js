const { generateReport } = require('../services/report.service');

const download = async (req, res, next) => {
  try {
    await generateReport(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { download };
