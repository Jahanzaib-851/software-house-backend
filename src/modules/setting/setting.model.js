// backend/src/modules/settings/settings.model.js
import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';

const settingsSchema = new mongoose.Schema(
  {
    companyName: String,
    companyEmail: String,
    companyPhone: String,
    companyAddress: String,
    logo: String,
    favicon: String,

    timezone: String,
    currency: String,
    dateFormat: String,
    language: String,

    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpFromEmail: String,

    passwordMinLength: { type: Number, default: 8 },
    sessionTimeout: Number,
    enableTwoFactor: { type: Boolean, default: false },

    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    inAppEnabled: { type: Boolean, default: true },

    status: { type: String, default: STATUS.ACTIVE },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
