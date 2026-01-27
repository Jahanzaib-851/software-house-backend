// backend/src/modules/asset/asset.model.js
import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';
import ASSET_CATEGORY from '../../constants/assetCategory.js';

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: (ASSET_CATEGORY && Object.values(ASSET_CATEGORY).length) ? Object.values(ASSET_CATEGORY) : ['hardware', 'software', 'furniture', 'license'],
      required: true
    },

    serialNumber: { type: String, required: true, unique: true, index: true, trim: true },

    purchaseDate: { type: Date, default: null },
    warrantyExpiry: { type: Date, default: null },

    cost: { type: Number, default: 0 },

    status: {
      type: String,
      enum:
        (STATUS && Object.values(STATUS).length)
          ? Object.values(STATUS)
          : ['available', 'assigned', 'maintenance', 'retired'],
      default: (STATUS && Object.values(STATUS).length) ? Object.values(STATUS)[0] : 'available'
    },

    // polymorphic assignment target: Employee | Room | Project
    assignedTo: { type: mongoose.Schema.Types.ObjectId, default: null, refPath: 'assignedToModel' },
    assignedToModel: { type: String, enum: ['Employee', 'Room', 'Project'], default: null },

    // location points to a Room
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    remarks: { type: String, default: null }
  },
  { timestamps: true }
);

// indexes
assetSchema.index({ status: 1 });
assetSchema.index({ category: 1 });

// hide __v
assetSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Asset', assetSchema);
