// backend/src/modules/room/room.routes.js
import { Router } from 'express';
import controller from './room.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import rateLimiter from '../../middlewares/rateLimiter.js';
import ROLES from '../../constants/roles.js';

const router = Router();

router.use(protect);

// create room (admin only)

// create room — admin + employee allowed
router.post('/', protect, controller.createRoom);


// list rooms (any authorized user)
router.get('/', validate('getRooms'), controller.getRooms);

// single room
router.get('/:id', validate('getById'), controller.getRoomById);

// update room (admin/manager)
router.patch('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), rateLimiter, validate('updateRoom'), controller.updateRoom);

// assign / release
router.patch('/:id/assign', authorize(ROLES.ADMIN, ROLES.MANAGER), validate('assignRoom'), controller.assignRoom);
router.patch('/:id/release', authorize(ROLES.ADMIN, ROLES.MANAGER), validate('releaseRoom'), controller.releaseRoom);

// delete (soft)
router.delete('/:id', authorize(ROLES.ADMIN), validate('deleteRoom'), controller.deleteRoom);

export default router;
