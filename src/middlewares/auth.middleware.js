import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import User from '../modules/auth/auth.model.js';

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 🔎 Fetch full user from DB
    const user = await User.findById(decoded.id).select('-password -tokens');

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    // Attach full user to request
    req.user = user;

    console.log('🔐 Authenticated User:', {
      id: user._id,
      role: user.role,
    });

    next();
  } catch (err) {
    next(new ApiError(401, 'Token is invalid or expired'));
  }
};

export default protect;
