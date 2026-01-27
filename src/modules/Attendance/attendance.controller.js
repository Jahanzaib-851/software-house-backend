import Attendance from './attendance.model.js';
import Employee from '../employee/employee.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

// 1. GET ALL LIST (Mahine ki Day-wise report with Super Search)
const getAttendanceList = asyncHandler(async (req, res) => {
  const { from, to, q, status } = req.query;

  let startDate = from ? new Date(from) : new Date();
  startDate.setUTCHours(0, 0, 0, 0);

  let endDate = to ? new Date(to) : new Date();
  endDate.setUTCHours(23, 59, 59, 999);

  // Dates ki list banana
  const dateList = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    dateList.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  let allEmployees = await Employee.find().populate('user').lean();

  // Search Logic
  if (q) {
    const searchLower = q.toLowerCase();
    allEmployees = allEmployees.filter(emp => {
      const name = (emp.fullName || emp.user?.fullName || "").toLowerCase();
      const id = (emp.employeeId || "").toLowerCase();
      return name.includes(searchLower) || id.includes(searchLower);
    });
  }

  const attendanceLogs = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  }).lean();

  let combinedData = [];

  allEmployees.forEach(emp => {
    const asaliName = emp.fullName || emp.user?.fullName || emp.user?.name || "Staff Member";

    dateList.forEach(date => {
      const log = attendanceLogs.find(a =>
        a.employee.toString() === emp._id.toString() &&
        new Date(a.date).toDateString() === date.toDateString()
      );

      const record = {
        _id: log?._id || `temp-${emp._id}-${date.getTime()}`,
        employee: {
          _id: emp._id,
          fullName: asaliName,
          employeeId: emp.employeeId || "N/A",
          designation: emp.designation || "Staff"
        },
        date: date,
        checkIn: log?.checkIn || null,
        checkOut: log?.checkOut || null,
        totalHours: log?.totalHours || 0,
        attendanceStatus: log?.attendanceStatus || 'absent'
      };

      if (!status || record.attendanceStatus === status) {
        combinedData.push(record);
      }
    });
  });

  combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.json(new ApiResponse(200, {
    data: combinedData,
    meta: { total: combinedData.length }
  }, 'Attendance list fetched'));
});

// 2. GET LOGGED-IN USER ATTENDANCE
const getMyAttendance = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) throw new ApiError(404, 'Employee profile not found');

  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Attendance.find({ employee: employee._id }).sort({ date: -1 }).skip(skip).limit(Number(limit)),
    Attendance.countDocuments({ employee: employee._id })
  ]);

  return res.json(new ApiResponse(200, {
    data: items,
    meta: { total, page: Number(page), limit: Number(limit) }
  }, 'My attendance fetched'));
});

// 3. MARK CHECK-IN
const markCheckIn = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) throw new ApiError(404, 'Employee profile not found');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({ employee: employee._id, date: today });
  if (existing) throw new ApiError(400, 'Already checked in');

  const attendance = await Attendance.create({
    employee: employee._id,
    checkIn: new Date(),
    date: today,
    attendanceStatus: 'present'
  });

  return res.json(new ApiResponse(201, attendance, 'Checked in successfully'));
});

// 4. MARK CHECK-OUT
const markCheckOut = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ employee: employee?._id, date: today });
  if (!attendance) throw new ApiError(404, 'Check-in not found');

  attendance.checkOut = new Date();
  await attendance.save();

  return res.json(new ApiResponse(200, attendance, 'Checked out successfully'));
});

// 5. UPDATE ATTENDANCE
const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Handling temp IDs from day-wise logic
  if (id.startsWith('temp-')) {
    const parts = id.split('-');
    const employeeId = parts[1];
    const timestamp = parseInt(parts[2]);
    const recordDate = new Date(timestamp);
    recordDate.setUTCHours(0, 0, 0, 0);

    let existing = await Attendance.findOne({ employee: employeeId, date: recordDate });
    if (existing) {
      Object.assign(existing, req.body);
      await existing.save();
      return res.json(new ApiResponse(200, existing, 'Updated'));
    }

    const newRecord = await Attendance.create({
      employee: employeeId,
      date: recordDate,
      ...req.body
    });
    return res.json(new ApiResponse(200, newRecord, 'Created'));
  }

  const attendance = await Attendance.findById(id);
  if (!attendance) throw new ApiError(404, 'Not found');

  Object.assign(attendance, req.body);
  await attendance.save();
  return res.json(new ApiResponse(200, attendance, 'Updated successfully'));
});

// 6. DELETE ATTENDANCE
const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id.startsWith('temp-')) throw new ApiError(400, 'Cannot delete unsaved record');

  const attendance = await Attendance.findByIdAndDelete(id);
  if (!attendance) throw new ApiError(404, 'Not found');

  return res.json(new ApiResponse(200, null, 'Deleted'));
});

export default {
  getMyAttendance,
  markCheckIn,
  markCheckOut,
  getAttendanceList,
  updateAttendance,
  deleteAttendance
};
