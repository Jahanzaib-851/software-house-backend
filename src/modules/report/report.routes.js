import { Router } from "express";
import {
  generateReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
} from "./report.controller.js";

// Middlewares
import protect from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import rateLimiter from "../../middlewares/rateLimiter.js";

// Constants
import ROLES from "../../constants/roles.js";

const router = Router();

// Sab se pehle login zaroori hai
router.use(protect);

/**
 * 1. Report Generate Karna (Admin aur Manager dono kar sakte hain)
 * Rate Limiter lagaya hai taake koi bot baar baar reports generate na kare
 */
router.post(
  "/",
  rateLimiter,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  generateReport
);

/**
 * 2. Reports ki List aur Single Report dekhna (Admin aur Manager)
 */
router.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  getReports
);

router.get(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  getReportById
);

/**
 * 3. Report Update aur Delete Karna (Sirf ADMIN ke liye)
 * Manager ko reports delete karne ki ijazat nahi honi chahiye (Data Security)
 */
router.patch(
  "/:id",
  authorize(ROLES.ADMIN),
  updateReport
);

router.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  deleteReport
);

export default router;