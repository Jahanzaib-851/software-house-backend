import Settings from './setting.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../utils/logger.js';

// 1. Get Settings
export const getSettings = asyncHandler(async (req, res, _next) => {
  let settings = await Settings.findOne();

  // Agar settings nahi milti toh create karo
  if (!settings) {
    settings = await Settings.create({});
    if (!settings) throw new ApiError(500, "Failed to initialize settings node");
  }

  // 🔥 Uniform format jo crash nahi hoga
  const response = new ApiResponse({
    data: settings,
    message: "Core Registry Synced",
    success: true
  });

  return res.status(200).json(response);
});

// 2. Update General Settings
export const updateSettings = asyncHandler(async (req, res, _next) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true
  });

  if (!settings) throw new ApiError(404, "Settings configuration not found");

  logger.info('Settings updated', { user: req.user?.id });

  const response = new ApiResponse({
    data: settings,
    message: 'System Identity Updated',
    success: true
  });
  return res.json(response);
});

// 3. Update Email Settings
export const updateEmailSettings = asyncHandler(async (req, res, _next) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true
  });

  if (!settings) throw new ApiError(500, "Mail Protocol Update Failed");

  logger.info('Email settings updated');

  const response = new ApiResponse({
    data: settings,
    message: 'Mail Engine Protocol Synchronized',
    success: true
  });
  return res.json(response);
});

// 4. Update Security Settings
export const updateSecuritySettings = asyncHandler(async (req, res, _next) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true
  });

  if (!settings) throw new ApiError(500, "Security Protocol Update Failed");

  logger.info('Security settings updated');

  const response = new ApiResponse({
    data: settings,
    message: 'Security Protocols Hardened',
    success: true
  });
  return res.json(response);
});

export default {
  getSettings,
  updateSettings,
  updateEmailSettings,
  updateSecuritySettings
};