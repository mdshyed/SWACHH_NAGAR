const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');

// Public — no auth required
router.get('/public', analyticsController.getPublicStats);

// Admin only
router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN));
router.get('/overview', analyticsController.getOverview);
router.get('/admin-performance', analyticsController.getAdminPerformance);
router.get('/trends', analyticsController.getTrends);
router.get('/by-category', analyticsController.byCategory);
router.get('/by-status', analyticsController.byStatus);
router.get('/by-ward', analyticsController.byWard);
router.get('/heatmap', analyticsController.getHeatmap);

module.exports = router;
