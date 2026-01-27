import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';

// Allowed roles list
const ROLES = ['admin', 'manager', 'employee', 'intern'];

const employeeSchema = new mongoose.Schema(
  {
    // User Account Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true // Faster population of user names/details
    },

    // Employee Identification
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Crucial for quick searching
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
      type: String,
      required: true
    },

    // Job Details
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: 'employee',
      index: true
    },
    designation: {
      type: String,
      trim: true,
      default: 'Staff',
      index: true
    },
    department: {
      type: String,
      trim: true,
      default: 'General',
      index: true
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time',
      index: true
    },
    salary: {
      type: Number,
      default: 0
    },
    joiningDate: {
      type: Date,
      default: Date.now,
      index: true
    },

    // --- Qualifications & Documents ---
    qualifications: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ""
    },
    cv_file: {
      type: String,
      default: ""
    },

    // Personal Details
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },

    // System Status
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
      index: true // Dashboard stats (Active/Inactive) isi se fast honge
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true // Creates createdAt and updatedAt
  }
);

// --- 🏎️ ADVANCED INDEXING FOR SPEED ---

// 1. Compound Index: Table filters aur sorting ko lightning fast banane ke liye
employeeSchema.index({ status: 1, department: 1, createdAt: -1 });

// 2. Search Index: Multi-field search (ID, Designation, Role) ke liye
employeeSchema.index({ employeeId: 1, designation: 1, role: 1 });

// --- JSON Transformation ---
employeeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    if (ret.password) delete ret.password; // Security: Never send password to frontend
    return ret;
  }
});

// Virtual for getting full name (Optional: If you need it often)
employeeSchema.virtual('isIntern').get(function () {
  return this.role === 'intern';
});

// Avoid Re-compilation Error
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export default Employee;