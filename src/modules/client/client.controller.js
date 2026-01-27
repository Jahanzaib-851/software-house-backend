import Client from './client.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import cloudinary from '../../config/cloudinary.js';
import logger from '../../utils/logger.js';
import STATUS from '../../constants/status.js';

/**
 * Helper to upload Buffer to Cloudinary using Stream
 */
const uploadFromBuffer = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};

const extractPublicId = (url = '') => {
  try {
    const parts = url.split('/');
    const filename = parts.pop();
    const folder = parts.pop();
    const name = filename.split('.').shift();
    return `${folder}/${name}`;
  } catch (e) { return null; }
};

// 1. CREATE CLIENT
const createClient = asyncHandler(async (req, res, _next) => {
  const { name, email, password, companyName, phone, address, notes } = req.body;

  if (!name || !email || !password) throw new ApiError(400, 'name, email and password are required');

  const exists = await Client.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');

  let avatarUrl = '';
  let coverImageUrl = '';

  if (req.files?.avatar?.[0]) {
    try {
      const result = await uploadFromBuffer(req.files.avatar[0].buffer, 'clients/avatars');
      avatarUrl = result.secure_url;
    } catch (err) {
      console.error("CLOUDINARY ERROR (Avatar):", err);
    }
  }

  if (req.files?.coverImage?.[0]) {
    try {
      const result = await uploadFromBuffer(req.files.coverImage[0].buffer, 'clients/covers');
      coverImageUrl = result.secure_url;
    } catch (err) {
      console.error("CLOUDINARY ERROR (Cover):", err);
    }
  }

  const client = await Client.create({
    name, email, password, companyName, phone, address, notes,
    avatar: avatarUrl,
    coverImage: coverImageUrl
  });

  logger.info('Client created', { client: client._id, by: req.user?._id });
  return res.status(201).json(new ApiResponse({ data: client, message: 'Client created' }));
});

// 2. UPDATE AVATAR
const updateAvatar = asyncHandler(async (req, res, _next) => {
  const userId = req.user?._id;
  if (!req.file) throw new ApiError(400, 'Avatar file required');

  const client = await Client.findById(userId);
  if (!client) throw new ApiError(404, 'Client not found');

  const result = await uploadFromBuffer(req.file.buffer, 'clients/avatars');

  if (client.avatar) {
    const publicId = extractPublicId(client.avatar);
    if (publicId) {
      try { await cloudinary.uploader.destroy(publicId); } catch (e) { logger.warn('Delete old avatar failed', e); }
    }
  }

  client.avatar = result.secure_url;
  await client.save();

  return res.json(new ApiResponse({ data: client, message: 'Avatar updated' }));
});

// 3. UPDATE COVER
const updateCoverImage = asyncHandler(async (req, res, _next) => {
  const userId = req.user?._id;
  if (!req.file) throw new ApiError(400, 'Cover image required');

  const client = await Client.findById(userId);
  const result = await uploadFromBuffer(req.file.buffer, 'clients/covers');

  if (client.coverImage) {
    const publicId = extractPublicId(client.coverImage);
    if (publicId) {
      try { await cloudinary.uploader.destroy(publicId); } catch (e) { logger.warn('Delete old cover failed', e); }
    }
  }

  client.coverImage = result.secure_url;
  await client.save();

  return res.json(new ApiResponse({ data: client, message: 'Cover image updated' }));
});

const getMyProfile = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.user?._id);
  if (!client) throw new ApiError(404, 'Client not found');
  return res.json(new ApiResponse({ data: client }));
});

const getClients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q, status } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
  if (status) filter.status = status;

  const items = await Client.find(filter).skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await Client.countDocuments(filter);
  return res.json(new ApiResponse({ data: items, meta: { total } }));
});

const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');
  return res.json(new ApiResponse({ data: client }));
});

const updateClientByAdmin = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  return res.json(new ApiResponse({ data: client }));
});

// ✅ FIXED: PERMANENT DELETE FUNCTION
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  // 1. Delete images from Cloudinary if they exist
  if (client.avatar) {
    const avatarId = extractPublicId(client.avatar);
    if (avatarId) await cloudinary.uploader.destroy(avatarId).catch(e => console.log("Cloudinary Avatar delete failed", e));
  }
  if (client.coverImage) {
    const coverId = extractPublicId(client.coverImage);
    if (coverId) await cloudinary.uploader.destroy(coverId).catch(e => console.log("Cloudinary Cover delete failed", e));
  }

  // 2. Permanently delete from MongoDB
  await Client.findByIdAndDelete(req.params.id);

  logger.info('Client deleted permanently', { clientId: req.params.id, by: req.user?._id });

  return res.json(new ApiResponse({
    data: null,
    message: 'Client and associated images deleted permanently'
  }));
});

const updateProfile = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.user?._id, req.body, { new: true });
  return res.json(new ApiResponse({ data: client }));
});

export default {
  createClient,
  getMyProfile,
  updateProfile,
  updateAvatar,
  updateCoverImage,
  getClients,
  getClientById,
  updateClientByAdmin,
  deleteClient
};