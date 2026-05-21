const router = require('express').Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const upload = require('../config/multer');
const ROLES = require('../constants/roles');

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.patch('/profile/avatar', upload.single('avatar'), userController.uploadAvatar);

// Admin
router.get('/admin/all', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getAllUsers);
router.patch('/admin/:id/ban', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.banUser);
router.patch('/admin/:id/role', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.updateRole);

module.exports = router;
