import { Router } from 'express';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import activityController from './activity.controller.js';
import ROLES from '../../constants/roles.js';

const router = Router();

// Protect all routes (user must be logged in)
router.use(protect);

// GET /api/activity/me
// Get activities of the logged-in user
router.get('/me', activityController.getMyActivities);

// Admin & Manager routes
router.use(authorize([ROLES.ADMIN, ROLES.MANAGER]));

// GET /api/activity/
// Get all activities (admin/manager only)
router.get('/', activityController.getAllActivities);

// DELETE /api/activity/:id
// Soft delete activity (admin/manager only)
router.delete('/:id', activityController.deleteActivity);

export default router;
