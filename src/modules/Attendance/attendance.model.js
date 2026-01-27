import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';
import ATTENDANCE_STATUS from '../../constants/attendanceStatus.js';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true // Single field index for basic queries
    },
    date: {
      type: Date,
      required: true,
      index: true, // Index for date-based filtering
      set: (v) => {
        if (!v) return v;
        const d = new Date(v);
        d.setUTCHours(0, 0, 0, 0);
        return d;
      }
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    totalHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    attendanceStatus: {
      type: String,
      enum: ATTENDANCE_STATUS ? Object.values(ATTENDANCE_STATUS) : ['present', 'absent', 'leave', 'half-day'],
      default: 'present',
      index: true // Index for status-based reports
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
      index: true // Index for active/inactive filtering
    }
  },
  { timestamps: true }
);

// 🚀 --- ADVANCED INDEXING FOR PERFORMANCE ---

// 1. Unique Compound Index: Aik employee ki aik din mein sirf aik entry ho sakti hai
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// 2. Compound Index for Filters: Employee history aur date range search ko fast karne ke liye
attendanceSchema.index({ employee: 1, date: -1, status: 1 });

// 3. Admin Dashboard Index: Pura attendance record fast fetch karne ke liye
attendanceSchema.index({ date: -1, attendanceStatus: 1 });



// --- PRE-SAVE CALCULATION LOGIC ---
attendanceSchema.pre('save', async function () {
  try {
    if (this.checkIn && this.checkOut) {
      const start = new Date(this.checkIn);
      const end = new Date(this.checkOut);

      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        const hours = diffMs / (1000 * 60 * 60);
        this.totalHours = Math.round(hours * 100) / 100;
        // Overtime 8 ghante ke baad calculate hota hai
        this.overtimeHours = Math.max(0, Math.round((hours - 8) * 100) / 100);
      }
    }
  } catch (err) {
    throw err;
  }
});

attendanceSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);