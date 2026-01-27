import Project from './project.model.js';
import Client from '../client/client.model.js';
import Employee from '../employee/employee.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import STATUS from '../../constants/status.js';

/**
 * NEW: Get Project Stats
 */
const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await Project.aggregate([
    { $match: { status: { $ne: 'inactive' } } },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } }
      }
    }
  ]);

  const result = stats[0] || { totalProjects: 0, active: 0, completed: 0, urgent: 0 };
  return res.json(new ApiResponse({ data: result, message: 'Stats fetched' }));
});

/**
 * Create Project
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description, client, team, timeline, priority, budget } = req.body;

  if (!name) throw new ApiError(400, "Project name is required");

  const project = await Project.create({
    name,
    description,
    client,
    team: team || [],
    timeline,
    priority,
    budget,
    createdBy: req.user?._id,
    assignedBy: req.user?._id
  });

  return res.status(201).json(new ApiResponse({ data: project, message: "Project created" }));
});

/**
 * Get All Projects (Listing)
 */
const getProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, q } = req.query;
  const filter = { status: { $ne: 'inactive' } };

  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Project.find(filter)
      .populate('client', 'name companyName avatar')
      .populate('team', 'name avatar designation email') // Populating from Employee model
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Project.countDocuments(filter)
  ]);

  return res.json(new ApiResponse({
    data: items,
    meta: { total, page: Number(page), limit: Number(limit) }
  }));
});

/**
 * Get Project By ID
 */
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('client', 'name companyName email avatar')
    .populate('team', 'name avatar designation email');

  if (!project) throw new ApiError(404, "Project not found");
  return res.json(new ApiResponse({ data: project }));
});

/**
 * Update Project
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!project) throw new ApiError(404, "Project not found");
  return res.json(new ApiResponse({ data: project, message: "Project updated" }));
});

/**
 * Delete Project (Soft Delete)
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
  if (!project) throw new ApiError(404, "Project not found");
  return res.json(new ApiResponse({ message: "Project deleted" }));
});

export default {
  getProjectStats,
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};