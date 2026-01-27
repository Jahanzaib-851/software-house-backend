import { Router } from 'express';
import controller from './client.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import upload from '../../middlewares/multer.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import ROLES from '../../constants/roles.js';

const router = Router();

/**
 * 1. Create Client (Admin Only usually)
 * Yahan 'upload.fields' lagana zaroori hai taake avatar aur cover dono handle hon
 */
router.post(
  '/',
  protect, // Admin auth zaroori hai
  authorize(ROLES.ADMIN),
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  validate('createClient'),
  controller.createClient
);

// Baki saare routes ke liye login zaroori hai
router.use(protect);

// 2. Client Own Profile (For /me routes)
router.get('/me', controller.getMyProfile);
router.patch('/me', validate('updateClientProfile'), controller.updateProfile);

// Image update routes (Multer single upload use ho raha hai)
router.patch('/me/avatar', upload.single('avatar'), controller.updateAvatar);
router.patch('/me/cover', upload.single('coverImage'), controller.updateCoverImage);

// 3. Admin Management Routes
router.get('/', authorize(ROLES.ADMIN), controller.getClients);
router.get('/:id', authorize(ROLES.ADMIN), validate('getById'), controller.getClientById);
router.patch('/:id', authorize(ROLES.ADMIN), validate('updateClientByAdmin'), controller.updateClientByAdmin);
router.delete('/:id', authorize(ROLES.ADMIN), controller.deleteClient);

export default router;