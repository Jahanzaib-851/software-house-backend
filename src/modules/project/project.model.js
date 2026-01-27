import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    // Team members are linked to the Employee collection
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    timeline: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    budget: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(STATUS).concat(['completed', 'on-hold', 'cancelled', 'inactive']).filter(Boolean),
      default: STATUS.ACTIVE || 'active'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Search optimization
projectSchema.index({ name: 'text', description: 'text' });

projectSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Project = mongoose.model('Project', projectSchema);
export default Project;