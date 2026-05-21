const router = require('express').Router();
const scheduleController = require('../controllers/schedule.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');

router.get('/', scheduleController.getAll);
router.get('/today', scheduleController.getToday);
router.get('/ward/:wardId', scheduleController.getByWard);

// Admin
router.post('/', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), scheduleController.create);
router.patch('/:id', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), scheduleController.update);
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), scheduleController.remove);

module.exports = router;
