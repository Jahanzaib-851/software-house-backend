// backend/src/modules/activity/activity.model.js
import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';
import ACTIONS from '../../constants/activityActions.js'; // optional constant file
import MODULES from '../../constants/modules.js'; // optional constant file

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ACTIONS ? Object.values(ACTIONS) : ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'APPROVE']
    },

    module: {
      type: String,
      required: true,
      enum: MODULES ? Object.values(MODULES) : ['auth', 'user', 'employee', 'project', 'finance', 'report', 'notification', 'attendance', 'payroll']
    },

    description: {
      type: String,
      required: true
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    targetModel: {
      type: String,
      default: null
    },

    ipAddress: {
      type: String,
      default: null
    },

    userAgent: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE
    }
  },
  { timestamps: true }
);

// indexes
activitySchema.index({ performedBy: 1 });
activitySchema.index({ module: 1 });
activitySchema.index({ createdAt: -1 });

activitySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Activity', activitySchema);
