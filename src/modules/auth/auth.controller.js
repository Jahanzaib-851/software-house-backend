import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';
import generateOTP from '../../utils/generateOTP.js';
import sendEmail from '../../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import User from "./auth.model.js";
import STATUS from '../../constants/status.js';

/* ===== GET CURRENT USER (Profile) ===== */
export const getMe = asyncHandler(async (req, res) => {
  // req.user protect middleware se aata hai
  const user = await User.findById(req.user?._id).select("-password -tokens");
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully"));
});

/* ===== REGISTER ===== */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) throw new ApiError(400, 'All fields are required');

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, 'Email already in use');

  const user = await User.create({ name, email, password, role, status: STATUS.PENDING });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 3600000;
  await user.save();

  await sendEmail({
    to: email,
    subject: 'Verify Your Account',
    html: `<p>Your verification OTP is <b>${otp}</b></p>`
  });

  const createdUser = await User.findById(user._id).select('-password -tokens');
  res.status(201).json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

/* ===== LOGIN ===== */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  // 1. Password field ko explicitly select karna zaroori hai agar model mein select: false hai
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // 2. Generate tokens (Ensure model.generateAuthTokens is working)
  const tokens = await user.generateAuthTokens();

  // 3. Response format ko backend/frontend ke liye match karein
  res.status(200).json(new ApiResponse(200, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user._id,
      name: user.name,
      role: user.role
    }
  }, 'Login successful'));
});

/* ===== LOGOUT ===== */
export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (user) {
    user.tokens = []; // Clear all refresh tokens
    await user.save();
  }
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/* ===== REFRESH TOKEN ===== */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token is required');

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.tokens.includes(refreshToken)) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(200).json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
  } catch (err) {
    throw new ApiError(401, 'Refresh token expired');
  }
});

/* ===== FORGOT & RESET (Same as before) ===== */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');

  const otp = generateOTP();
  user.passwordResetOTP = otp;
  user.passwordResetExpires = Date.now() + 3600000;
  await user.save();

  await sendEmail({ to: email, subject: 'Reset OTP', html: `OTP: ${otp}` });
  res.status(200).json(new ApiResponse(200, null, 'OTP sent'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.passwordResetOTP !== otp || user.passwordResetExpires < Date.now()) {
    throw new ApiError(400, 'Invalid OTP');
  }
  user.password = newPassword;
  user.passwordResetOTP = undefined;
  await user.save();
  res.status(200).json(new ApiResponse(200, null, 'Success'));
});

export const deleteTestUser = asyncHandler(async (req, res) => {
  await User.findOneAndDelete({ email: req.body.email });
  res.status(200).json(new ApiResponse(200, null, 'Deleted'));
});