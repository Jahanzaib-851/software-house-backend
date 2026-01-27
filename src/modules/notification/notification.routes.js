import { Router } from 'express';
import controller from './notification.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import rateLimiter from '../../middlewares/rateLimiter.js';
import ROLES from '../../constants/roles.js';

const router = Router();

router.use(protect);

// ---------------------------------------------------------
// ⚡ IMPORTANT: Static routes hamesha Dynamic (:id) se UUPAR honi chahiye
// ---------------------------------------------------------

// 1. Bulk Read (Isay /:id se hamesha upar rakhein)
router.patch('/read', controller.markAsRead);

// 2. Bulk Delete
router.delete('/', authorize(ROLES.ADMIN), controller.deleteNotification);

// 3. Admin Create
router.post('/', rateLimiter, authorize(ROLES.ADMIN), validate('createNotification'), controller.createNotification);

// 4. View All
router.get('/all', authorize(ROLES.ADMIN, ROLES.MANAGER), validate('getAllNotifications'), controller.getAllNotifications);

// 5. Get My Inbox
router.get('/me', validate('getMyNotifications'), controller.getMyNotifications);

// ---------------------------------------------------------
// ⚡ Dynamic Routes (Hamesha end mein)
// ---------------------------------------------------------

// 6. Single Read
router.patch('/:id/read', validate('markAsRead'), controller.markAsRead);

// 7. Single Delete
router.delete('/:id', authorize(ROLES.ADMIN), validate('deleteNotification'), controller.deleteNotification);

export default router;