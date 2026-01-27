import User from './user.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import cloudinary from '../../config/cloudinary.js';
import logger from '../../utils/logger.js';
import STATUS from '../../constants/status.js';
import mongoose from 'mongoose'; // 🔥 Zaroori import for validation

const createUser = asyncHandler(async (req, res, _next) => {
  const user = await User.create(req.body);
  logger.info(`User created: ${user.email}`);
  const response = new ApiResponse({ data: user, message: 'User created', success: true });
  return res.status(201).json(response);
});

const getProfile = asyncHandler(async (req, res, _next) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');
  const response = new ApiResponse({ data: user, message: 'Profile fetched' });
  return res.json(response);
});

const updateProfile = asyncHandler(async (req, res, _next) => {
  const updates = (({ name, phone, bio }) => ({ name, phone, bio }))(req.body);
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  const response = new ApiResponse({ data: user, message: 'Profile updated' });
  return res.json(response);
});

const updateAvatar = asyncHandler(async (req, res, _next) => {
  if (!req.file) throw new ApiError(400, 'Avatar required');
  const upload = await cloudinary.uploader.upload(req.file.path, { folder: 'avatars' });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: upload.secure_url },
    { new: true }
  );
  const response = new ApiResponse({ data: user, message: 'Avatar updated' });
  return res.json(response);
});

const updateCoverImage = asyncHandler(async (req, res, _next) => {
  if (!req.file) throw new ApiError(400, 'Cover image required');
  const upload = await cloudinary.uploader.upload(req.file.path, { folder: 'covers' });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { coverImage: upload.secure_url },
    { new: true }
  );
  const response = new ApiResponse({ data: user, message: 'Cover image updated' });
  return res.json(response);
});

const getUsers = asyncHandler(async (req, res, _next) => {
  const { page = 1, limit = 10, search, role } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query)
  ]);

  return res.json({
    success: true,
    message: 'Users list fetched',
    total: total,
    count: total,
    data: {
      items: users,
      meta: { total, page: Number(page), limit: Number(limit) }
    }
  });
});

const getUserById = asyncHandler(async (req, res, _next) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const response = new ApiResponse({ data: user, message: 'User fetched' });
  return res.json(response);
});

const updateUserByAdmin = asyncHandler(async (req, res, _next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  const response = new ApiResponse({ data: user, message: 'User updated' });
  return res.json(response);
});

/**
 * 🛠️ UPDATED: Delete (Block) User by ID or Email
 * This prevents the 500 CastError when an email is passed instead of an ObjectId.
 */
const deleteUser = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  let filter = {};

  // Check if provided ID is a valid MongoDB ObjectId or an Email string
  if (mongoose.Types.ObjectId.isValid(id)) {
    filter = { _id: id };
  } else {
    filter = { email: id };
  }

  const user = await User.findOneAndUpdate(
    filter,
    { status: STATUS.BLOCKED },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found with this ID or Email');
  }

  logger.warn(`User blocked by admin: ${user.email} (${user._id})`);
  const response = new ApiResponse({
    data: user,
    message: 'User blocked successfully',
    success: true
  });

  return res.json(response);
});

export default {
  createUser,
  getProfile,
  updateProfile,
  updateAvatar,
  updateCoverImage,
  getUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser
};