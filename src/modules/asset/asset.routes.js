// backend/src/modules/asset/asset.routes.js
import { Router } from 'express';
import controller from './asset.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import rateLimiter from '../../middlewares/rateLimiter.js';
import ROLES from '../../constants/roles.js';

const router = Router();

router.use(protect);

// create asset (admin only)
router.post('/', authorize(ROLES.ADMIN /*, ROLES.MANAGER if desired*/), rateLimiter, validate('createAsset'), controller.createAsset);

// list & filters
router.get('/', validate('getAssets'), controller.getAssets);

// single asset
router.get('/:id', validate('getById'), controller.getAssetById);

// update
router.patch('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), rateLimiter, validate('updateAsset'), controller.updateAsset);

// assign / unassign / maintenance / retire
router.patch('/:id/assign', authorize(ROLES.ADMIN, ROLES.MANAGER), validate('assignAsset'), controller.assignAsset);
router.patch('/:id/unassign', authorize(ROLES.ADMIN, ROLES.MANAGER), validate('unassignAsset'), controller.unassignAsset);
router.patch('/:id/maintenance', authorize(ROLES.ADMIN, ROLES.MANAGER), validate('sendToMaintenance'), controller.sendToMaintenance);
router.delete('/:id', authorize(ROLES.ADMIN), validate('retireAsset'), controller.retireAsset);

export default router;
