import express from 'express';
import {
  register,
  login,
  logout,
  getMe,        // 👈 Added getMe
  refreshToken,
  forgotPassword,
  resetPassword,
  deleteTestUser,
} from './auth.controller.js';
import protect from '../../middlewares/auth.middleware.js';

const router = express.Router();

// ===== Public Routes =====
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ===== Protected Routes =====
// Frontend isi endpoint (/me) ko call kar raha hai profile ke liye
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// ===== Dev Only =====
router.delete('/delete-test-user', deleteTestUser);

export default router;