const router = require('express').Router();
const Joi = require('joi');
const complaintController = require('../controllers/complaint.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../config/multer');
const ROLES = require('../constants/roles');

const createComplaintSchema = Joi.object({
  title:       Joi.string().min(10).max(120).required(),
  description: Joi.string().min(20).max(1000).required(),
  category:    Joi.string().required(),
  latitude:    Joi.number().min(-90).max(90).required(),
  longitude:   Joi.number().min(-180).max(180).required(),
  ward:        Joi.string().optional(),
  priority:    Joi.string().valid('low', 'medium', 'high').optional(),
  anonymous:   Joi.boolean().optional(),
});

const updateStatusSchema = Joi.object({
  status:  Joi.string().valid('pending', 'assigned', 'in_progress', 'escalated', 'resolved', 'rejected').required(),
  comment: Joi.string().max(500).optional().allow(''),
});

router.use(authenticate);

// Fixed-path routes must come before parameterized /:id routes
router.get('/map', complaintController.getMapData);
router.get('/mine', complaintController.getMine);
router.get('/nearby', complaintController.getNearby);
router.get('/', complaintController.getAll);
router.post('/', requireRole(ROLES.USER), upload.array('images', 5), validate(createComplaintSchema), complaintController.create);

router.get('/locations', complaintController.getHeatmapData);

// Admin fixed-path routes (must be before /:id)
router.get('/admin/all', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), complaintController.getAll);
router.patch('/admin/:id/status', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), validate(updateStatusSchema), complaintController.updateStatus);
router.put('/:id/status', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), validate(updateStatusSchema), complaintController.updateStatus);
router.delete('/admin/:id', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), complaintController.adminRemove);
router.post('/admin/:id/after-image', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), upload.single('image'), complaintController.uploadAfterImage);

// Parameterized routes
router.get('/:id', complaintController.getById);
router.delete('/:id', complaintController.remove);
router.post('/:id/upvote', complaintController.upvote);
router.post('/:id/vote', complaintController.castVote);
router.post('/:id/reopen', complaintController.reopenComplaint);
router.get('/:id/timeline', complaintController.getTimeline);

module.exports = router;
