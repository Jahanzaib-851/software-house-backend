import { Router } from 'express';
import ctrl from './employee.controller.js';
import protect from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import upload from '../../middlewares/multer.middleware.js';

const router = Router();

// Sabhi routes ke liye login zaroori hai
router.use(protect);

// Admin aur Manager ka access control
const adminOrManager = authorize('admin', 'manager');

// 1. Get All Employees
router.get('/', adminOrManager, ctrl.getEmployees);

// 2. Create Employee
router.post(
  '/',
  adminOrManager,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cv_file', maxCount: 1 }
  ]),
  ctrl.createEmployee
);

// -------------------- SPECIFIC ID ROUTES --------------------

router.route('/:id')
  .get(adminOrManager, ctrl.getEmployeeById)
  .put(
    adminOrManager,
    upload.fields([
      { name: 'avatar', maxCount: 1 },
      { name: 'cv_file', maxCount: 1 }
    ]),
    ctrl.updateEmployee // ✅ Ab yahi function sab kuch handle karega
  )
  .delete(adminOrManager, ctrl.deleteEmployee);

// -------------------- SPECIAL UPDATES --------------------

// ✅ FIX: Purana '/:id/avatar' wala route ab ctrl.updateEmployee ko hi use karega
// Taake agar frontend se purani API call ho toh server crash na ho
router.put(
  '/:id/avatar',
  adminOrManager,
  upload.single('avatar'),
  ctrl.updateEmployee // Humne avatar update ko bhi isi main function par redirect kar diya
);

// 3. Change Status
router.patch('/:id/status', adminOrManager, ctrl.changeEmployeeStatus);

export default router;