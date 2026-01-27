import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';
import PAYMENT_STATUS from '../../constants/paymentStatus.js';

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    year: {
      type: Number,
      required: true
    },

    salary: {
      basicSalary: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      bonuses: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 }
    },

    calculations: {
      grossSalary: { type: Number, default: 0 },
      netSalary: { type: Number, default: 0 }
    },

    attendance: {
      workingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 }
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS ? Object.values(PAYMENT_STATUS) : ['pending', 'paid', 'hold'],
      default: PAYMENT_STATUS ? PAYMENT_STATUS.PENDING : 'pending'
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    remarks: {
      type: String
    },

    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE
    }
  },
  { timestamps: true }
);

// Prevent duplicate payroll for same employee + month + year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// ✅ FIXED: Using async function instead of next callback to avoid TypeError
payrollSchema.pre('save', async function () {
  try {
    const basic = Number(this.salary?.basicSalary || 0);
    const allowances = Number(this.salary?.allowances || 0);
    const bonuses = Number(this.salary?.bonuses || 0);
    const deductions = Number(this.salary?.deductions || 0);

    const gross = Math.round((basic + allowances + bonuses) * 100) / 100;
    const net = Math.round((gross - deductions) * 100) / 100;

    this.calculations = {
      grossSalary: gross,
      netSalary: net
    };

    // Ensure attendance numbers are safe
    if (!this.attendance) {
      this.attendance = { workingDays: 0, presentDays: 0, absentDays: 0 };
    } else {
      this.attendance.workingDays = Math.floor(Number(this.attendance.workingDays || 0));
      this.attendance.presentDays = Math.floor(Number(this.attendance.presentDays || 0));
      this.attendance.absentDays = Math.floor(Number(this.attendance.absentDays || 0));
    }

    // No next() call needed in async hooks
  } catch (err) {
    throw err; // Re-throw error to stop the save process
  }
});

// Hide __v
payrollSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Payroll', payrollSchema);