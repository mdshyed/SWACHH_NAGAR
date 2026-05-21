const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/complaints', require('./complaint.routes'));
router.use('/gamification', require('./gamification.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/blogs', require('./blog.routes'));
router.use('/schedules', require('./schedule.routes'));
router.use('/health', require('./health.routes'));
router.use('/wards', require('./ward.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
