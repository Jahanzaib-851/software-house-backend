import mongoose from "mongoose";
import STATUS from "../../constants/status.js";

const reportSchema = new mongoose.Schema(
  {
    // Report ki pehchan (e.g., 'finance', 'attendance', 'project')
    reportType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    // Date filters (Monthly ya Yearly reports ke liye)
    month: {
      type: Number,
      min: 1,
      max: 12
    },
    year: {
      type: Number
    },

    // Linked Entities (Inko populate karke hum frontend pe naam dikhayenge)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      index: true
    },

    // Main Report Data (Isme JSON format mein saara calculated data save hoga)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    remarks: {
      type: String,
      trim: true
    },

    // Kis admin/manager ne report banayi
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE
    },
  },
  {
    timestamps: true // Isse "createdAt" mil jayega jo report ki date hogi
  }
);

// Search optimization ke liye Compound Index
reportSchema.index({ reportType: 1, year: 1, month: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;