import Payroll from './payroll.model.js';
import Employee from '../employee/employee.model.js';
import Attendance from '../Attendance/attendance.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../utils/logger.js';
import STATUS from '../../constants/status.js';
import PAYMENT_STATUS from '../../constants/paymentStatus.js';

/**
 * Helper: Attendance summary calculate karne ke liye
 */
const getAttendanceSummary = async (employeeId, month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: end },
    status: STATUS.ACTIVE
  });

  return {
    workingDays: records.length,
    presentDays: records.filter(r => r.attendanceStatus === 'present').length,
    absentDays: records.filter(r => r.attendanceStatus === 'absent').length
  };
};

/**
 * getPayrollList: 
 * DASHBOARD LOGIC: Ye API dashboard ke main cards ke liye 'stats' bhejti hai 
 * aur niche ki table ke liye 'items' bhejti hai.
 */
const getPayrollList = asyncHandler(async (req, res) => {
  const { month, year, employee: employeeId, paymentStatus, page = 1, limit = 20 } = req.query;
  const filter = { status: STATUS.ACTIVE };

  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (employeeId) filter.employee = employeeId;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (Number(page) - 1) * Number(limit);

  // 1. DASHBOARD STATS: Filtered records par total net calculate karna
  const allFilteredRecords = await Payroll.find(filter);
  const stats = {
    totalNet: allFilteredRecords.reduce((acc, curr) => acc + (curr.calculations?.netSalary || 0), 0),
    paidCount: allFilteredRecords.filter(p => p.paymentStatus === 'paid').length,
    pendingCount: allFilteredRecords.filter(p => p.paymentStatus === 'pending').length,
  };

  // 2. PAGINATED DATA: Dashboard table ke liye
  const [items, total] = await Promise.all([
    Payroll.find(filter)
      .populate('employee', 'employeeId designation user')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payroll.countDocuments(filter)
  ]);

  // Response structure jo Frontend Dashboard handle kar sake
  return res.json(new ApiResponse(200, {
    items,
    stats,
    pagination: { total, page: Number(page), limit: Number(limit) }
  }, 'Payroll list fetched successfully'));
});

/**
 * generatePayroll: Naya payroll banana
 */
const generatePayroll = asyncHandler(async (req, res) => {
  const { employee: employeeId, month, year, salary = {}, remarks } = req.body;
  if (!employeeId) throw new ApiError(400, 'Employee is required');

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const existing = await Payroll.findOne({ employee: employeeId, month, year, status: STATUS.ACTIVE });
  if (existing) throw new ApiError(409, 'Payroll for this period already exists');

  const attendanceSummary = await getAttendanceSummary(employeeId, Number(month), Number(year));

  const payroll = await Payroll.create({
    employee: employeeId,
    month: Number(month),
    year: Number(year),
    salary: {
      basicSalary: Number(salary.basicSalary || 0),
      allowances: Number(salary.allowances || 0),
      bonuses: Number(salary.bonuses || 0),
      deductions: Number(salary.deductions || 0)
    },
    attendance: attendanceSummary,
    generatedBy: req.user?._id,
    remarks,
    paymentStatus: PAYMENT_STATUS?.PENDING || 'pending'
  });

  return res.status(201).json(new ApiResponse(201, payroll, 'Payroll generated'));
});

/**
 * getMyPayroll: Employee apna record dekhe
 */
const getMyPayroll = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) throw new ApiError(404, 'Employee profile not found');

  const items = await Payroll.find({ employee: employee._id, status: STATUS.ACTIVE }).sort({ year: -1, month: -1 });
  return res.json(new ApiResponse(200, items, 'My payrolls'));
});

const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate('employee', 'employeeId designation user');
  if (!payroll) throw new ApiError(404, 'Payroll not found');
  return res.json(new ApiResponse(200, payroll, 'Payroll fetched'));
});

const updatePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw new ApiError(404, 'Payroll not found');
  if (req.body.salary) payroll.salary = { ...payroll.salary, ...req.body.salary };
  if (req.body.remarks) payroll.remarks = req.body.remarks;
  if (req.body.paymentStatus) payroll.paymentStatus = req.body.paymentStatus;
  await payroll.save();
  return res.json(new ApiResponse(200, payroll, 'Payroll updated'));
});

const markPayrollPaid = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByIdAndUpdate(req.params.id, { paymentStatus: PAYMENT_STATUS?.PAID || 'paid' }, { new: true });
  return res.json(new ApiResponse(200, payroll, 'Status updated'));
});

const deletePayroll = asyncHandler(async (req, res) => {
  await Payroll.findByIdAndUpdate(req.params.id, { status: STATUS.INACTIVE });
  return res.json(new ApiResponse(200, null, 'Payroll deleted'));
});

export default {
  generatePayroll,
  getMyPayroll,
  getPayrollList,
  getPayrollById,
  updatePayroll,
  markPayrollPaid,
  deletePayroll
};