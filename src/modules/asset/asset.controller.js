// backend/src/modules/asset/asset.controller.js
import Asset from './asset.model.js';
import Employee from '../employee/employee.model.js';
import Room from '../room/room.model.js';
import Project from '../project/project.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../utils/logger.js';
import STATUS from '../../constants/status.js';
import ASSET_CATEGORY from '../../constants/assetCategory.js';

/**
 * createAsset
 */
const createAsset = asyncHandler(async (req, res, _next) => {
  const {
    name,
    category,
    serialNumber,
    purchaseDate,
    warrantyExpiry,
    cost,
    remarks
  } = req.body;

  if (!name) throw new ApiError(400, 'name is required');
  if (!serialNumber) throw new ApiError(400, 'serialNumber is required');
  if (!category) throw new ApiError(400, 'category is required');

  if (ASSET_CATEGORY && !Object.values(ASSET_CATEGORY).includes(category)) {
    throw new ApiError(400, 'invalid category');
  }

  // prevent duplicate serial
  const exists = await Asset.findOne({ serialNumber: serialNumber.trim() });
  if (exists) throw new ApiError(409, 'Asset with this serialNumber already exists');

  const doc = {
    name,
    category,
    serialNumber: serialNumber.trim(),
    purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
    cost: Number(cost) || 0,
    remarks: remarks || null,
    createdBy: req.user?._id
  };

  const asset = await Asset.create(doc);
  logger.info('Asset created', { id: asset._id, by: req.user?._id });
  return res.status(201).json(new ApiResponse({ data: asset, message: 'Asset created' }));
});

/**
 * getAssets
 */
const getAssets = asyncHandler(async (req, res, _next) => {
  const { page = 1, limit = 20, status, category, assignedTo } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (assignedTo) filter.assignedTo = assignedTo;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Asset.find(filter).populate('assignedTo').populate('location').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Asset.countDocuments(filter)
  ]);

  return res.json(new ApiResponse({
    data: items,
    meta: { total, page: Number(page), limit: Number(limit) },
    message: 'Assets fetched'
  }));
});

/**
 * getAssetById
 */
const getAssetById = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, 'id is required');

  const asset = await Asset.findById(id).populate('assignedTo').populate('location').populate('createdBy', 'name email');
  if (!asset) throw new ApiError(404, 'Asset not found');

  return res.json(new ApiResponse({ data: asset, message: 'Asset fetched' }));
});

/**
 * updateAsset
 */
const updateAsset = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const updates = (({ name, category, purchaseDate, warrantyExpiry, cost, remarks, status, location }) =>
    ({ name, category, purchaseDate, warrantyExpiry, cost, remarks, status, location }))(req.body);

  const asset = await Asset.findById(id);
  if (!asset) throw new ApiError(404, 'Asset not found');

  if (updates.serialNumber && updates.serialNumber !== asset.serialNumber) {
    const dup = await Asset.findOne({ serialNumber: updates.serialNumber });
    if (dup) throw new ApiError(409, 'serialNumber already in use');
    asset.serialNumber = updates.serialNumber;
  }

  if (updates.category) {
    if (ASSET_CATEGORY && !Object.values(ASSET_CATEGORY).includes(updates.category)) {
      throw new ApiError(400, 'invalid category');
    }
    asset.category = updates.category;
  }

  if (updates.name) asset.name = updates.name;
  if (typeof updates.purchaseDate !== 'undefined') asset.purchaseDate = updates.purchaseDate ? new Date(updates.purchaseDate) : null;
  if (typeof updates.warrantyExpiry !== 'undefined') asset.warrantyExpiry = updates.warrantyExpiry ? new Date(updates.warrantyExpiry) : null;
  if (typeof updates.cost !== 'undefined') asset.cost = Number(updates.cost) || 0;
  if (typeof updates.remarks !== 'undefined') asset.remarks = updates.remarks;
  if (typeof updates.status !== 'undefined') asset.status = updates.status;
  if (typeof updates.location !== 'undefined') asset.location = updates.location;

  await asset.save();
  logger.info('Asset updated', { id: asset._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: asset, message: 'Asset updated' }));
});

/**
 * assignAsset
 * body: { assignedTo, assignedToModel } // assignedToModel: 'Employee' | 'Project' | 'Room'
 */
const assignAsset = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const { assignedTo, assignedToModel } = req.body;
  if (!assignedTo || !assignedToModel) throw new ApiError(400, 'assignedTo and assignedToModel are required');

  if (!['Employee', 'Project', 'Room'].includes(assignedToModel)) throw new ApiError(400, 'assignedToModel must be Employee | Project | Room');

  const asset = await Asset.findById(id);
  if (!asset) throw new ApiError(404, 'Asset not found');

  // validate target exists
  if (assignedToModel === 'Employee') {
    const emp = await Employee.findById(assignedTo);
    if (!emp) throw new ApiError(404, 'Employee not found');
  } else if (assignedToModel === 'Project') {
    const proj = await Project.findById(assignedTo);
    if (!proj) throw new ApiError(404, 'Project not found');
  } else if (assignedToModel === 'Room') {
    const room = await Room.findById(assignedTo);
    if (!room) throw new ApiError(404, 'Room not found');
  }

  asset.assignedTo = assignedTo;
  asset.assignedToModel = assignedToModel;
  asset.status = (STATUS && Object.values(STATUS).includes('assigned')) ? 'assigned' : 'assigned';
  await asset.save();

  logger.info('Asset assigned', { id: asset._id, to: `${assignedToModel}:${assignedTo}`, by: req.user?._id });
  return res.json(new ApiResponse({ data: asset, message: 'Asset assigned' }));
});

/**
 * unassignAsset
 */
const unassignAsset = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const asset = await Asset.findById(id);
  if (!asset) throw new ApiError(404, 'Asset not found');

  asset.assignedTo = null;
  asset.assignedToModel = null;
  asset.status = (STATUS && Object.values(STATUS).includes('available')) ? 'available' : 'available';
  await asset.save();

  logger.info('Asset unassigned', { id: asset._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: asset, message: 'Asset unassigned' }));
});

/**
 * sendToMaintenance
 */
const sendToMaintenance = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const asset = await Asset.findById(id);
  if (!asset) throw new ApiError(404, 'Asset not found');

  asset.status = (STATUS && Object.values(STATUS).includes('maintenance')) ? 'maintenance' : 'maintenance';
  await asset.save();

  logger.info('Asset sent to maintenance', { id: asset._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: asset, message: 'Asset sent to maintenance' }));
});

/**
 * retireAsset (soft delete / retire)
 */
const retireAsset = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const asset = await Asset.findByIdAndUpdate(id, { status: (STATUS && Object.values(STATUS).includes('retired')) ? 'retired' : 'retired' }, { new: true });
  if (!asset) throw new ApiError(404, 'Asset not found');

  logger.info('Asset retired', { id: asset._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: asset, message: 'Asset retired' }));
});

export default {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  assignAsset,
  unassignAsset,
  sendToMaintenance,
  retireAsset
};
