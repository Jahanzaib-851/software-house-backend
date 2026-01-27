import { Router } from 'express';
import controller from './payroll.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import rateLimiter from '../../middlewares/rateLimiter.js';
import ROLES from '../../constants/roles.js';

const router = Router();

router.use(protect);

// generate payroll (admin, manager) - rate limited
router.post(
  '/',
  rateLimiter,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate('generatePayroll'),
  controller.generatePayroll
);

// employee: view own payrolls
router.get(
  '/me',
  authorize(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN),
  controller.getMyPayroll
);

// admin/manager list & management
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate('getPayrollList'),
  controller.getPayrollList
);

// view single payroll (admin, manager)
router.get(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate('getById'),
  controller.getPayrollById
);

// update payroll (admin, manager)
router.patch(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate('updatePayroll'),
  controller.updatePayroll
);

// mark payroll as paid (admin, manager)
router.patch(
  '/:id/pay',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  controller.markPayrollPaid
);

// delete payroll (admin, manager)
router.delete(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  controller.deletePayroll
);

export default router;
