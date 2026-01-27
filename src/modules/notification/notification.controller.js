import Notification from './notification.model.js';
import User from '../user/user.model.js';
import Employee from '../employee/employee.model.js';
import Client from '../client/client.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../utils/logger.js';
import sendEmail from '../../utils/sendEmail.js';
import sendMessage from '../../utils/sendMessage.js';

/**
 * 🛠️ Helper: Resolve contact info for polymorphic recipients
 */
const resolveRecipientContact = async (recipient) => {
  if (!recipient?.id || !recipient?.model) return { email: null, phone: null };

  const models = { User, Employee, Client };
  try {
    const data = await models[recipient.model].findById(recipient.id).select('email phone user');
    if (!data) return { email: null, phone: null };

    let email = data.email || null;
    if (recipient.model === 'Employee' && data.user && !email) {
      const u = await User.findById(data.user).select('email');
      email = u?.email || null;
    }
    return { email, phone: data.phone || null };
  } catch (err) {
    logger.warn(`Contact resolution failed for ${recipient.model}: ${err.message}`);
    return { email: null, phone: null };
  }
};

/**
 * ⚙️ Helper: Background Delivery (Non-blocking)
 */
async function processBackgroundDeliveries(notifications, type) {
  for (const note of notifications) {
    const updatedDeliveries = [];
    for (const channel of note.channels) {
      try {
        if (channel === 'email' && note.recipientContact?.email) {
          await sendEmail({
            to: note.recipientContact.email,
            subject: `[${type}] System Notification`,
            html: `<p>${note.message}</p>`
          });
          updatedDeliveries.push({ channel, status: 'delivered', deliveredAt: new Date() });
        } else {
          updatedDeliveries.push({ channel, status: 'delivered', deliveredAt: new Date() });
        }
      } catch (err) {
        updatedDeliveries.push({ channel, status: 'failed', error: err.message });
        logger.error(`Delivery failed for ${channel}:`, err);
      }
    }
    await Notification.findByIdAndUpdate(note._id, { deliveries: updatedDeliveries });
  }
}

/**
 * 🚀 1. Create Notification
 */
const createNotification = asyncHandler(async (req, res) => {
  const { notificationType, message, recipients, channels = ['in-app'], remarks } = req.body;

  if (!notificationType || !message) throw new ApiError(400, 'Type and message are required');
  if (!recipients?.length) throw new ApiError(400, 'Recipients array is required');

  const docs = await Promise.all(recipients.map(async (r) => {
    const contact = await resolveRecipientContact(r);
    return {
      notificationType,
      message,
      recipient: r.id,
      recipientModel: r.model,
      recipientContact: contact,
      channels,
      deliveries: channels.map(ch => ({ channel: ch, status: 'pending' })),
      status: 'unread',
      createdBy: req.user?._id,
      sentBy: req.user?._id,
      remarks: remarks || null
    };
  }));

  const saved = await Notification.insertMany(docs);
  processBackgroundDeliveries(saved, notificationType);

  return res.status(201).json(new ApiResponse(201, saved, 'Notifications created and queued'));
});

/**
 * 📥 2. Get My Notifications (User Inbox)
 * ✨ FIXED: Added filter to exclude 'archived' status
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, status, notificationType, q } = req.query;
  const userId = req.user?._id;

  const matchedIds = [userId];
  const [emp, cli] = await Promise.all([
    Employee.findOne({ user: userId }).select('_id'),
    Client.findOne({ user: userId }).select('_id')
  ]);
  if (emp) matchedIds.push(emp._id);
  if (cli) matchedIds.push(cli._id);

  // ⚡ IMPORTANT: status: { $ne: 'archived' } means "NOT EQUAL TO ARCHIVED"
  const filter = {
    recipient: { $in: matchedIds },
    status: { $ne: 'archived' }
  };

  if (status) filter.status = status;
  if (notificationType) filter.notificationType = notificationType;
  if (q) filter.message = { $regex: q, $options: 'i' };

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter)
  ]);

  return res.json(new ApiResponse(200, {
    items,
    meta: { total, page: Number(page), pages: Math.ceil(total / limit) }
  }, 'My notifications fetched'));
});

/**
 * 🌍 3. Get All Notifications (Admin/Manager View)
 */
const getAllNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, notificationType, q } = req.query;

  const filter = { status: { $ne: 'archived' } };
  if (status) filter.status = status;
  if (notificationType) filter.notificationType = notificationType;
  if (q) filter.message = { $regex: q, $options: 'i' };

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter)
  ]);

  return res.json(new ApiResponse(200, {
    items,
    meta: { total, page: Number(page), pages: Math.ceil(total / limit) }
  }, 'All system notifications fetched'));
});

/**
 * ✅ 4. Mark As Read (Single & Bulk)
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ids } = req.body;
  const targetIds = id ? [id] : ids;

  if (!targetIds?.length) throw new ApiError(400, 'No IDs provided');

  await Notification.updateMany(
    { _id: { $in: targetIds } },
    { $set: { status: 'read' } }
  );

  return res.json(new ApiResponse(200, null, 'Marked as read successfully'));
});

/**
 * 🗑️ 5. Delete Notification (Soft Delete)
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ids } = req.body;
  const targetIds = id ? [id] : ids;

  if (!targetIds?.length) throw new ApiError(400, 'No IDs provided');

  // Set status to archived instead of permanent delete
  await Notification.updateMany(
    { _id: { $in: targetIds } },
    { $set: { status: 'archived' } }
  );

  return res.json(new ApiResponse(200, null, 'Notifications archived/deleted'));
});

export default {
  createNotification,
  getMyNotifications,
  getAllNotifications,
  markAsRead,
  deleteNotification
};