import Activity from '../modules/activity/activity.model.js';
import STATUS from '../constants/status.js';

/**
 * Logger Utility
 * Console par print bhi karega aur Database mein record bhi save karega
 */
const logger = {
  // 1. Database mein Activity Save karne ke liye main function
  save: async (req, { action, module, description, targetId = null, targetModel = null }) => {
    try {
      // Database mein entry create karna
      await Activity.create({
        action,             // e.g., 'LOGIN', 'CREATE'
        module,             // e.g., 'auth', 'user'
        description,        // e.g., 'User logged in successfully'
        performedBy: req.user?._id || null, // Authenticated user ki ID
        targetId,           // Optional: Jis cheez par action hua (e.g. user id)
        targetModel,        // Optional: Model ka naam (e.g. 'User')
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent'],
        status: STATUS.ACTIVE
      });

      console.log(`✨ [DB LOG SAVED]: ${action} | ${module} | ${description}`);
    } catch (error) {
      console.error("❌ [DB LOG ERROR]:", error.message);
    }
  },

  // 2. Standard Console Logs (For Debugging)
  info: (msg, meta = null) => {
    if (meta) console.log(`[INFO] ${msg}`, meta);
    else console.log(`[INFO] ${msg}`);
  },

  warn: (msg, meta = null) => {
    if (meta) console.warn(`[WARN] ${msg}`, meta);
    else console.warn(`[WARN] ${msg}`);
  },

  error: (msg, meta = null) => {
    if (meta) console.error(`[ERROR] ${msg}`, meta);
    else console.error(`[ERROR] ${msg}`);
  },

  debug: (msg, meta = null) => {
    if (meta) console.debug(`[DEBUG] ${msg}`, meta);
    else console.debug(`[DEBUG] ${msg}`);
  }
};

export default logger;