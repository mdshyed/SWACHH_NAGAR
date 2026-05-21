const cron = require('node-cron');
const Complaint = require('../models/Complaint.model');
const notificationService = require('./notification.service');
const { getIO } = require('../config/socket');
const { MAP_ROOM } = require('../sockets');
const logger = require('../config/logger');

const ACTIVE_STATUSES = ['pending', 'assigned', 'in_progress'];

const runEscalation = async () => {
  try {
    const now = new Date();
    const overdue = await Complaint.find({
      status: { $in: ACTIVE_STATUSES },
      slaDeadline: { $lt: now },
      isDeleted: false,
    }).select('_id complaintId reporter ward status slaDeadline');

    if (overdue.length === 0) return;

    const ids = overdue.map((c) => c._id);
    await Complaint.updateMany(
      { _id: { $in: ids } },
      {
        $set: { status: 'escalated', escalatedAt: now },
        $push: {
          statusHistory: {
            status: 'escalated',
            comment: 'Automatically escalated — SLA deadline exceeded',
            timestamp: now,
          },
        },
      }
    );

    logger.info(`Escalation: ${overdue.length} complaint(s) escalated`);

    // Emit real-time updates and send notifications
    let io;
    try { io = getIO(); } catch {}

    for (const complaint of overdue) {
      if (io) {
        io.to(MAP_ROOM).emit('complaint:updated', { id: complaint._id, status: 'escalated' });
      }

      notificationService.send({
        recipient: complaint.reporter,
        type: 'complaint_escalated',
        title: { en: `Complaint ${complaint.complaintId} Escalated`, hi: `शिकायत ${complaint.complaintId} एस्केलेट हुई` },
        body: { en: 'Your complaint was not resolved within the SLA and has been escalated for priority attention.', hi: 'आपकी शिकायत SLA के भीतर हल नहीं हुई और प्राथमिकता के लिए एस्केलेट की गई।' },
        data: { complaintId: complaint._id },
        reference: { model: 'Complaint', id: complaint._id },
      }).catch(() => {});
    }
  } catch (err) {
    logger.error(`Escalation cron error: ${err.message}`);
  }
};

// Run every 15 minutes
const startEscalationCron = () => {
  cron.schedule('*/15 * * * *', runEscalation);
  logger.info('Escalation cron started (every 15 min)');
};

module.exports = { startEscalationCron, runEscalation };
