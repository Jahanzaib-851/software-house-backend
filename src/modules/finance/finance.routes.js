import { Router } from 'express';
import controller from './finance.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import rateLimiter from '../../middlewares/rateLimiter.js';
import ROLES from '../../constants/roles.js';

const router = Router();

// Sabhi finance operations ke liye login lazmi hai
router.use(protect);

/**
 * Global Finance Routes
 */
router.route('/')
  // List & Summary: Admin aur Manager dono dekh sakte hain
  .get(
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    validate('getTransactions'),
    controller.getTransactions
  )
  // Create: Admin aur Manager dono entries kar sakte hain
  .post(
    rateLimiter,
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    validate('createTransaction'),
    controller.createTransaction
  );

/**
 * Specific Transaction Routes (ID based)
 */
router.route('/:id')
  // Detail View: Admin aur Manager ke liye
  .get(
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    validate('getById'),
    controller.getTransactionById
  )
  // Update: Admin aur Manager dono edit kar sakte hain
  .patch(
    rateLimiter,
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    validate('updateTransaction'),
    controller.updateTransaction
  )
  // Delete: SECURITY BEST PRACTICE - Sirf Admin delete kar sakay
  .delete(
    authorize(ROLES.ADMIN),
    controller.deleteTransaction
  );

export default router;