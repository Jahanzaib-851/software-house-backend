import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Report from "./report.model.js";

/**
 * 1. Generate a new report
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { reportType, month, year } = req.body;

  if (!reportType) {
    throw new ApiError(400, "Report type is required (e.g., finance, project)");
  }

  if (month && (month < 1 || month > 12)) {
    throw new ApiError(400, "Invalid month. Must be between 1 and 12");
  }

  if (year && (year < 2000 || year > 2100)) {
    throw new ApiError(400, "Invalid year provided");
  }

  const reportPayload = {
    ...req.body,
    generatedBy: req.user?._id,
  };

  const report = await Report.create(reportPayload);

  return res.status(201).json(
    new ApiResponse(201, report, "Report generated successfully")
  );
});

/**
 * 2. Get list of reports with pagination, filter & SEARCH
 */
export const getReports = asyncHandler(async (req, res) => {
  // 🎯 Frontend se 'search' query pakri
  const { page = 1, limit = 10, type, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};

  // 1. Dropdown filter (Type)
  if (type) {
    filter.reportType = type;
  }

  // 2. 🔍 Search Logic (Global Search)
  if (search) {
    filter.$or = [
      { reportType: { $regex: search, $options: "i" } }, // 'i' ka matlab case-insensitive (chota bada search barabar)
      { remarks: { $regex: search, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    Report.find(filter)
      .populate("project", "name")
      .populate("client", "name companyName")
      .populate("employee", "name employeeId")
      .populate("generatedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Report.countDocuments(filter),
  ]);

  return res.json(
    new ApiResponse(200, {
      items,
      meta: { total, page: Number(page), limit: Number(limit) }
    }, "Reports fetched successfully")
  );
});

/**
 * 3. Get a single report by ID
 */
export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate("project")
    .populate("client")
    .populate("employee")
    .populate("generatedBy", "name");

  if (!report) throw new ApiError(404, "Report not found");

  return res.json(new ApiResponse(200, report, "Report details fetched"));
});

/**
 * 4. Update report
 */
export const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!report) throw new ApiError(404, "Report not found");

  return res.json(new ApiResponse(200, report, "Report updated successfully"));
});

/**
 * 5. Delete report
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndDelete(req.params.id);

  if (!report) throw new ApiError(404, "Report not found");

  return res.json(new ApiResponse(200, null, "Report deleted successfully"));
});

export default {
  generateReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
};