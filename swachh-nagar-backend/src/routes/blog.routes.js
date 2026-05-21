const router = require('express').Router();
const blogController = require('../controllers/blog.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const upload = require('../config/multer');
const ROLES = require('../constants/roles');

router.get('/', blogController.getAll);
router.get('/:slug', blogController.getBySlug);
router.post('/:id/like', authenticate, blogController.toggleLike);

// Admin
router.post('/', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), upload.single('coverImage'), blogController.create);
router.patch('/:id', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), blogController.update);
router.patch('/:id/publish', authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), blogController.publish);

module.exports = router;
