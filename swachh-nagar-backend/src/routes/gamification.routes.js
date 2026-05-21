const router = require('express').Router();
const gamificationController = require('../controllers/gamification.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');

router.use(authenticate);

router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/leaderboard/:period', gamificationController.getLeaderboard);
router.get('/badges', gamificationController.getAllBadges);
router.get('/badges/mine', gamificationController.getMyBadges);
router.get('/points/history', gamificationController.getPointsHistory);

// Admin
router.post('/badges', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), gamificationController.createBadge);
router.post('/points/award', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), gamificationController.awardPoints);

module.exports = router;
