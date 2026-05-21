const COMPLAINT_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
});

const ALL_STATUSES = ['pending', 'assigned', 'in_progress', 'escalated', 'resolved', 'rejected'];

const STATUS_TRANSITIONS = Object.freeze({
  pending:     ALL_STATUSES.filter((s) => s !== 'pending'),
  assigned:    ALL_STATUSES.filter((s) => s !== 'assigned'),
  in_progress: ALL_STATUSES.filter((s) => s !== 'in_progress'),
  escalated:   ALL_STATUSES.filter((s) => s !== 'escalated'),
  resolved:    ALL_STATUSES.filter((s) => s !== 'resolved'),
  rejected:    ALL_STATUSES.filter((s) => s !== 'rejected'),
});

module.exports = { COMPLAINT_STATUS, STATUS_TRANSITIONS };
