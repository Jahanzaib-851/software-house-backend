// backend/src/modules/notification/notification.model.js
import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';
import NOTIFICATION_TYPE from '../../constants/notificationTypes.js';

const deliverySchema = new mongoose.Schema(
  {
    channel: { type: String }, // 'in-app' | 'email' | 'sms'
    status: { type: String, default: 'pending' }, // pending, delivered, failed
    deliveredAt: { type: Date, default: null },
    error: { type: String, default: null }
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    notificationType: {
      type: String,
      enum: NOTIFICATION_TYPE ? Object.values(NOTIFICATION_TYPE) : ['info', 'alert', 'reminder', 'system'],
      default: NOTIFICATION_TYPE ? NOTIFICATION_TYPE.INFO : 'info'
    },

    message: {
      type: String,
      required: true
    },

    // polymorphic recipient: refPath points to recipientModel ('User' | 'Employee' | 'Client')
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientModel'
    },

    recipientModel: {
      type: String,
      required: true,
      enum: ['User', 'Employee', 'Client']
    },

    // snapshot contact details stored for reliable delivery (email/phone at send time)
    recipientContact: {
      email: { type: String, default: null },
      phone: { type: String, default: null }
    },

    // channels requested: in-app, email, sms
    channels: {
      type: [String],
      default: ['in-app']
    },

    // per-channel delivery info
    deliveries: {
      type: [deliverySchema],
      default: []
    },

    // Notification lifecycle status (unread/read/archived) - uses STATUS constant values if provided
    status: {
      type: String,
      enum: (STATUS && Object.values(STATUS).length) ? Object.values(STATUS) : ['unread', 'read', 'archived'],
      default: (STATUS && Object.values(STATUS).length) ? Object.values(STATUS)[0] : 'unread'
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    remarks: {
      type: String
    }
  },
  { timestamps: true }
);

// indexes
notificationSchema.index({ recipient: 1, recipientModel: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ notificationType: 1 });

notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Notification', notificationSchema);
