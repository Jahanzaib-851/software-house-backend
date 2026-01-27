// backend/src/modules/room/room.model.js
import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';
import ROOM_TYPES from '../../constants/roomTypes.js';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },

    type: {
      type: String,
      enum: ROOM_TYPES ? Object.values(ROOM_TYPES) : ['meeting', 'office', 'lab', 'conference'],
      default: ROOM_TYPES ? ROOM_TYPES.MEETING : 'meeting'
    },

    capacity: {
      type: Number,
      default: 1,
      min: 0
    },

    floor: {
      type: String,
      trim: true,
      default: null
    },

    status: {
      type: String,
      enum:
        (STATUS && Object.values(STATUS).length)
          ? Object.values(STATUS)
          : ['available', 'occupied', 'maintenance', 'inactive'],
      default: (STATUS && Object.values(STATUS).length) ? Object.values(STATUS)[0] : 'available'
    },

    // assignedTo can be a project or a team id (store as ObjectId and you'll manage the semantics in controller)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    remarks: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// index on status for faster queries
roomSchema.index({ status: 1 });

roomSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Room', roomSchema);
