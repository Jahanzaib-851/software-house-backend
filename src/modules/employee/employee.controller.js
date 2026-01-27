import Employee from './employee.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import cloudinary from '../../config/cloudinary.js';
import STATUS from '../../constants/status.js';
import streamifier from 'streamifier';

// Helper: Cloudinary Buffer Upload
const streamUpload = (buffer, folder, type = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: type },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// 1. CREATE EMPLOYEE
export const createEmployee = asyncHandler(async (req, res) => {
  const { role, password, designation, department, qualifications } = req.body;
  const userId = req.user?._id || req.user?.id;

  if (!userId || !password) {
    throw new ApiError(400, 'User authentication and Password are required');
  }

  const existingProfile = await Employee.findOne({ user: userId }).lean();
  if (existingProfile) {
    throw new ApiError(400, 'Profile for this user already exists');
  }

  const employeeId = `EMP${Date.now()}`;
  const email = `${employeeId.toLowerCase()}@softwarehouse.com`;

  let avatar = "", cv_file = "";
  if (req.files) {
    if (req.files.avatar?.[0]) {
      const uploadRes = await streamUpload(req.files.avatar[0].buffer, 'employees/avatars');
      avatar = uploadRes.secure_url;
    }
    if (req.files.cv_file?.[0]) {
      const uploadRes = await streamUpload(req.files.cv_file[0].buffer, 'employees/docs', 'raw');
      cv_file = uploadRes.secure_url;
    }
  }

  const employee = await Employee.create({
    user: userId,
    role: role || 'employee',
    password,
    employeeId,
    email,
    designation: designation || 'Staff',
    department: department || 'General',
    qualifications,
    avatar,
    cv_file,
    createdBy: userId
  });

  res.status(201).json(new ApiResponse({ data: employee, message: 'Profile created successfully' }));
});

// 2. GET ALL EMPLOYEES (SUPER FAST & DASHBOARD COMPATIBLE)
export const getEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, department, q } = req.query;
  const filter = {};

  // Filters
  if (status && status !== 'all') filter.status = status.toLowerCase();
  if (department && department !== 'all') filter.department = department;

  // Search Logic
  if (q && q.trim() !== "") {
    const searchRegex = { $regex: q.trim(), $options: 'i' };

    // User search optimized with .lean() and select only ID
    const matchingUsers = await User.find({ name: searchRegex }).select('_id').lean();
    const userIds = matchingUsers.map(u => u._id);

    filter.$or = [
      { employeeId: searchRegex },
      { designation: searchRegex },
      { email: searchRegex },
      { user: { $in: userIds } }
    ];
  }

  // Speed Boost: Parallel Execution for items and counts
  const skip = (Number(page) - 1) * Number(limit);

  const [items, totalInDB, totalInSearch] = await Promise.all([
    Employee.find(filter)
      .populate('user', 'name email role avatar')
      .select('-password') // Password kabhi na mangwayein speed ke liye
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean(), // 🚀 5x Faster: Converts Mongoose docs to plain JSON

    Employee.countDocuments().lean(),
    Employee.countDocuments(filter).lean()
  ]);

  res.status(200).json({
    success: true,
    total: totalInDB,       // Dashboard Stats
    searchTotal: totalInSearch, // Pagination
    data: items,
    page: Number(page),
    totalPages: Math.ceil(totalInSearch / Number(limit))
  });
});

// 3. GET BY ID
export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('user', 'name email role')
    .lean(); // Faster lookup

  if (!employee) throw new ApiError(404, 'Employee record not found');
  res.json(new ApiResponse({ data: employee }));
});

// 4. UPDATE EMPLOYEE
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let updateData = { ...req.body };

  // Cleanup
  ['avatar', 'cv_file'].forEach(field => {
    if (updateData[field] && (typeof updateData[field] === 'object' || updateData[field] === "{}")) {
      delete updateData[field];
    }
  });

  if (req.files) {
    if (req.files.avatar?.[0]) {
      const uploadRes = await streamUpload(req.files.avatar[0].buffer, 'employees/avatars');
      updateData.avatar = uploadRes.secure_url;
    }
    if (req.files.cv_file?.[0]) {
      const uploadRes = await streamUpload(req.files.cv_file[0].buffer, 'employees/docs', 'raw');
      updateData.cv_file = uploadRes.secure_url;
    }
  }

  const employee = await Employee.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('user', 'name email role').lean();

  if (!employee) throw new ApiError(404, 'Record not found');
  res.json(new ApiResponse({ data: employee, message: 'Updated successfully' }));
});

// 5. CHANGE STATUS
export const changeEmployeeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { status: status.toLowerCase() },
    { new: true }
  ).lean();
  res.json(new ApiResponse({ data: employee, message: `Status changed to ${status}` }));
});

// 6. DELETE (SOFT DELETE)
export const deleteEmployee = asyncHandler(async (req, res) => {
  await Employee.findByIdAndUpdate(req.params.id, { status: STATUS.INACTIVE }).lean();
  res.json(new ApiResponse({ message: 'Employee deactivated successfully' }));
});

export default {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  changeEmployeeStatus,
  deleteEmployee
};