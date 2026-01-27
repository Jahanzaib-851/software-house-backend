import ApiError from '../utils/ApiError.js';

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log("❌ [Auth Error]: req.user missing");
      return next(new ApiError(401, 'Unauthorized'));
    }

    // .flat() isliye taake agar roles [['admin']] ki shakal mein aayein toh theek ho jayein
    const roles = allowedRoles.flat().map(r => String(r).toLowerCase().trim());
    const userRole = String(req.user.role || "").toLowerCase().trim();

    console.log("👤 [Final Debug]:", {
      userHas: userRole,
      allowedAre: roles,
      isAllowed: roles.includes(userRole) || userRole === 'admin'
    });

    if (roles.includes(userRole) || userRole === 'admin') {
      return next();
    }

    return next(new ApiError(403, 'Forbidden: Access denied'));
  };
};

export default authorize;