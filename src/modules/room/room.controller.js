// backend/src/modules/room/room.controller.js
import Room from './room.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../utils/logger.js';
import STATUS from '../../constants/status.js';
import ROOM_TYPES from '../../constants/roomTypes.js';

/**
 * createRoom
 */
const createRoom = asyncHandler(async (req, res, _next) => {
  const { name, type, capacity, floor, remarks } = req.body;

  if (!name) throw new ApiError(400, 'Room name is required');

  // prevent duplicate names (case-insensitive)
  const exists = await Room.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (exists) throw new ApiError(409, 'Room with this name already exists');

  if (type && ROOM_TYPES && !Object.values(ROOM_TYPES).includes(type)) {
    throw new ApiError(400, 'Invalid room type');
  }

  const room = await Room.create({
    name,
    type: type || (ROOM_TYPES ? ROOM_TYPES.MEETING : 'meeting'),
    capacity: capacity || 1,
    floor: floor || null,
    remarks: remarks || null,
    createdBy: req.user?._id
  });

  logger.info('Room created', { id: room._id, by: req.user?._id });
  return res.status(201).json(new ApiResponse({ data: room, message: 'Room created' }));
});

/**
 * getRooms
 */
const getRooms = asyncHandler(async (req, res, _next) => {
  const { page = 1, limit = 20, status, type, floor, q } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (floor) filter.floor = floor;
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { remarks: { $regex: q, $options: 'i' } }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Room.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Room.countDocuments(filter)
  ]);

  return res.json(new ApiResponse({
    data: items,
    meta: { total, page: Number(page), limit: Number(limit) },
    message: 'Rooms fetched'
  }));
});

/**
 * getRoomById
 */
const getRoomById = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, 'id is required');

  const room = await Room.findById(id);
  if (!room) throw new ApiError(404, 'Room not found');

  return res.json(new ApiResponse({ data: room, message: 'Room fetched' }));
});

/**
 * updateRoom
 */
const updateRoom = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const { name, type, capacity, status, floor, remarks } = req.body;

  const room = await Room.findById(id);
  if (!room) throw new ApiError(404, 'Room not found');

  // if changing name, ensure uniqueness
  if (name && name.toLowerCase() !== room.name.toLowerCase()) {
    const exists = await Room.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) throw new ApiError(409, 'Room with this name already exists');
    room.name = name;
  }

  if (type) {
    if (ROOM_TYPES && !Object.values(ROOM_TYPES).includes(type)) {
      throw new ApiError(400, 'Invalid room type');
    }
    room.type = type;
  }

  if (typeof capacity !== 'undefined') room.capacity = capacity;
  if (typeof floor !== 'undefined') room.floor = floor;
  if (typeof remarks !== 'undefined') room.remarks = remarks;
  if (status) {
    if (STATUS && Object.values(STATUS).includes(status)) {
      room.status = status;
    } else {
      // allow also specific room status keywords if STATUS doesn't map to room states directly
      room.status = status;
    }
  }

  await room.save();
  logger.info('Room updated', { id: room._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: room, message: 'Room updated' }));
});

/**
 * assignRoom
 * body: { assignedTo } - assign to a project/team id
 */
const assignRoom = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const { assignedTo } = req.body;
  if (!assignedTo) throw new ApiError(400, 'assignedTo is required');

  const room = await Room.findById(id);
  if (!room) throw new ApiError(404, 'Room not found');

  room.assignedTo = assignedTo;
  // mark as occupied
  room.status = (STATUS && Object.values(STATUS).includes('occupied')) ? 'occupied' : 'occupied';

  await room.save();
  logger.info('Room assigned', { id: room._id, assignedTo, by: req.user?._id });
  return res.json(new ApiResponse({ data: room, message: 'Room assigned' }));
});

/**
 * releaseRoom
 * unassign and mark available
 */
const releaseRoom = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;

  const room = await Room.findById(id);
  if (!room) throw new ApiError(404, 'Room not found');

  room.assignedTo = null;
  room.status = (STATUS && Object.values(STATUS).includes('available')) ? 'available' : 'available';

  await room.save();
  logger.info('Room released', { id: room._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: room, message: 'Room released' }));
});

/**
 * deleteRoom (soft)
 */
const deleteRoom = asyncHandler(async (req, res, _next) => {
  const { id } = req.params;
  const room = await Room.findByIdAndUpdate(id, { status: STATUS.INACTIVE }, { new: true });
  if (!room) throw new ApiError(404, 'Room not found');

  logger.info('Room soft-deleted', { id: room._id, by: req.user?._id });
  return res.json(new ApiResponse({ data: room, message: 'Room deleted' }));
});

export default {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  assignRoom,
  releaseRoom,
  deleteRoom
};
