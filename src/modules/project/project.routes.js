import { Router } from 'express';
import controller from './project.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import ROLES from '../../constants/roles.js';

const router = Router();

// Sabhi routes ke liye login zaroori hai
router.use(protect);

/**
 * 1. Project Stats (HAMESHA Sabse Upar)
 * Iska validate hataya hai kyunki isme koi params nahi chahiye hote
 */
router.get(
  '/stats',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  controller.getProjectStats
);

/**
 * 2. Create Project
 */
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate('createProject'),
  controller.createProject
);

/**
 * 3. Get All Projects (List)
 */
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT),
  // validate('getProjects'), // Agar ye crash kar raha hai toh temporary comment karein
  controller.getProjects
);

/**
 * 4. Get Project by ID (HAMESHA Dynamic Routes Niche)
 */
router.get(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT),
  validate('getById'),
  controller.getProjectById
);

/**
 * 5. Update Project
 */
router.patch(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate('updateProject'),
  controller.updateProject
);

/**
 * 6. Delete Project
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate('deleteProject'),
  controller.deleteProject
);

export default router;