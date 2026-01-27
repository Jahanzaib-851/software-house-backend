import { Router } from "express";
import controller from "./attendance.controller.js";
import protect from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import ROLES from "../../constants/roles.js";

const router = Router();

// 1. Sab se pehle Authentication Middleware (Login check)
router.use(protect);

// ==========================================
// 🟢 USER ROUTES (Hamesha Top Par Priority)
// ==========================================

// GET /api/attendance/me (Logged-in user ka data)
router.get("/me", controller.getMyAttendance);

// POST /api/attendance/check-in
router.post("/check-in", controller.markCheckIn);

// POST /api/attendance/check-out
router.post("/check-out", controller.markCheckOut);


// ==========================================
// 🔴 ADMIN/MANAGER ROUTES (Role Based)
// ==========================================
const ADMIN = ROLES?.ADMIN || 'admin';
const MANAGER = ROLES?.MANAGER || 'manager';

// GET /api/attendance/ (Admin gets full list)
// Isay /me ke niche hona chahiye taake clash na ho
router.get("/", authorize(ADMIN, MANAGER), controller.getAttendanceList);

// PATCH /api/attendance/:id (Update specific record)
router.patch("/:id", authorize(ADMIN), controller.updateAttendance);

// DELETE /api/attendance/:id
router.delete("/:id", authorize(ADMIN), controller.deleteAttendance);

export default router;