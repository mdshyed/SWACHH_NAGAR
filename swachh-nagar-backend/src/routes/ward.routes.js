const router = require('express').Router();
const wardController = require('../controllers/ward.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');

// Public — no auth needed
router.get('/', wardController.getAll);
router.get('/:id/stats', wardController.getStats);

// Admin only — seed default wards
router.post('/seed', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), wardController.seed);

module.exports = router;
