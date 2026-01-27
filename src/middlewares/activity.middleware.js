// src/middlewares/activity.middleware.js
import activityController from '../modules/activity/activity.controller.js';

export const autoActivityLogger = async (req, res, next) => {
  // Sirf data tabdeeli wale methods ko pakrein
  const methodsToLog = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (methodsToLog.includes(req.method)) {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        // URL se module ka naam nikalna (e.g., /api/projects -> project)
        const moduleName = req.originalUrl.split('/')[2] || 'system';

        const actionMap = {
          'POST': 'CREATE',
          'PUT': 'UPDATE',
          'PATCH': 'UPDATE',
          'DELETE': 'DELETE'
        };

        await activityController.logActivity({
          action: actionMap[req.method],
          module: moduleName,
          description: `${actionMap[req.method]} action performed on ${moduleName}`,
          performedBy: req.user._id,
          req
        });
      }
    });
  }
  next();
};