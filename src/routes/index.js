import express from "express";

// Middlewares
// Note: 'protect' default export hai isliye bina brackets {} ke aayega
import protect from "../middlewares/auth.middleware.js";
import { autoActivityLogger } from "../middlewares/activity.middleware.js";

// Route Imports
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import employeeRoutes from "../modules/employee/employee.routes.js";
import attendanceRoutes from "../modules/Attendance/attendance.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import clientRoutes from "../modules/client/client.routes.js";
import projectRoutes from "../modules/project/project.routes.js";
import roomRoutes from "../modules/room/room.routes.js";
import assetRoutes from "../modules/asset/asset.routes.js";
import financeRoutes from "../modules/finance/finance.routes.js";
import reportRoutes from "../modules/report/report.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";
import activityRoutes from "../modules/activity/activity.routes.js";
import settingRoutes from '../modules/setting/setting.routes.js';

const router = express.Router();

// 1. PUBLIC ROUTES
// Auth routes ko protect se upar rakhein taake login ho sake
router.use("/auth", authRoutes);

// --- PROTECTED AREA ---
// Ab yahan se login zaroori hai
router.use(protect);
router.use(autoActivityLogger); // Har POST/PUT/DELETE khud record hoga

// 2. PRIVATE ROUTES
router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/payroll", payrollRoutes);
router.use("/clients", clientRoutes);
router.use("/projects", projectRoutes);
router.use("/rooms", roomRoutes);
router.use("/assets", assetRoutes);
router.use("/finance", financeRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);
router.use("/activities", activityRoutes);
router.use('/settings', settingRoutes);

export default router;