// backend/src/modules/settings/settings.routes.js
import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  updateEmailSettings,
  updateSecuritySettings
} from './setting.controller.js';

import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import rateLimiter from '../../middlewares/rateLimiter.js';
import ROLES from '../../constants/roles.js';

const router = Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get('/', getSettings);
router.patch('/', rateLimiter, updateSettings);
router.patch('/email', rateLimiter, updateEmailSettings);
router.patch('/security', rateLimiter, updateSecuritySettings);

export default router;
