const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');

router.get('/download', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), reportController.download);

module.exports = router;
