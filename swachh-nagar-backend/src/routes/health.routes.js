const router = require('express').Router();
const healthController = require('../controllers/health.controller');

router.get('/', healthController.liveness);
router.get('/ready', healthController.readiness);

module.exports = router;
