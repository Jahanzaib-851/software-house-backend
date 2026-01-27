// backend/src/modules/activity/activity.controller.js
import Activity from './activity.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../utils/logger.js';
import STATUS from '../../constants/status.js';
import ROLES from '../../constants/roles.js';

/**
 * logActivity
 * Called internally to persist an activity record.
 * params: { action, module, description, performedBy, targetId, targetModel, req }
 * req is optional; if provided ipAddress and userAgent will be extracted
 */
const logActivity = async (payload = {}) => {
  try {
    const {
      action,
      module,
      description,
      performedBy,
      targetId = null,
      targetModel = null,
      req = null,
      status = STATUS.ACTIVE
    } = payload;

    if (!action || !module || !description || !performedBy) {
      logger.warn('Activity not logged - missing required fields', { payload });
      return null;
    }

    const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress) : null;
    const userAgent = req ? (req.headers?.['user-agent'] || null) : null;

    const doc = {
      action,
      module,
      description,
      performedBy,
      targetId,
      targetModel,
      ipAddress,
      userAgent,
      status
    };

    const activity = await Activity.create(doc);
    logger.info('Activity logged', { id: activity._id, action, module, by: performedBy });
    return activity;
  } catch (err) {
    logger.error('logActivity error', err);
    return null;
  }
};

/**
 * getMyActivities
 * GET /me
 */
const getMyActivities = asyncHandler(async (req, res, _next) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { page = 1, limit = 20, module, action, from, to } = req.query;
  const filter = { performedBy: userId, status: STATUS.ACTIVE };

  if (module) filter.module = module;
  if (action) filter.action = action;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Activity.countDocuments(filter)
  ]);

  return res.json(new ApiResponse({ data: items, meta: { total, page: Number(page), limit: Number(limit) }, message: 'My activities fetched' }));
});

/**
 * getAllActivities
 * GET /
 * admin-only
 */
const getAllActivities = asyncHandler(async (req, res, _next) => {
  // ensure admin access is enforced by route authorize middleware
  const { page = 1, limit = 20, module, action, user, from, to } = req.query;
  const filter = { status: STATUS.ACTIVE };

  if (module) filter.module = module;
  if (action) filter.action = action;
  if (user) filter.performedBy = user;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Activity.countDocuments(filter)
  ]);

  return res.json(new ApiResponse({ data: items, meta: { total, page: Number(page), limit: Number(limit) }, message: 'Activities fetched' }));
});

/**
 * deleteActivity
 * soft delete by setting status = inactive
 */
const deleteActivity = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, 'id is required');

  const activity = await Activity.findByIdAndUpdate(id, { status: STATUS.INACTIVE }, { new: true });
  if (!activity) throw new ApiError(404, 'Activity not found');

  logger.info('Activity soft-deleted', { id: activity._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: activity, message: 'Activity deleted' }));
});

export default {
  logActivity,
  getMyActivities,
  getAllActivities,
  deleteActivity
};
