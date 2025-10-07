import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config.js';
import { sendErrorResponse } from '../utils/response.js';

// Verify JWT token and authenticate user
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return sendErrorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
      return sendErrorResponse(res, 'Access denied. Invalid token format.', 401);
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Find user by ID from token
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return sendErrorResponse(res, 'Token is valid but user not found.', 401);
      }

      // Check if user account is active
      if (user.status !== 'active') {
        return sendErrorResponse(res, 'Account is not active. Please contact administrator.', 403);
      }

      // Check if account is locked
      if (user.isLocked) {
        return sendErrorResponse(res, 'Account is temporarily locked due to too many failed login attempts.', 423);
      }

      // Attach user to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return sendErrorResponse(res, 'Token has expired. Please login again.', 401);
      } else if (jwtError.name === 'JsonWebTokenError') {
        return sendErrorResponse(res, 'Invalid token.', 401);
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return sendErrorResponse(res, 'Server error during authentication.', 500);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(res, 'Access denied. Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendErrorResponse(res, 
        `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`, 
        403
      );
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize('admin');

// Instructor and Admin middleware
export const instructorOrAdmin = authorize('instructor', 'admin');

// Student only middleware
export const studentOnly = authorize('student');

// Check if user can access specific resource
export const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const resourceId = req.params.id;

      switch (resourceType) {
        case 'exam':
          // Students can only access exams they're eligible for
          if (user.role === 'student') {
            const Exam = (await import('../models/Exam.js')).default;
            const exam = await Exam.findById(resourceId);
            
            if (!exam) {
              return sendErrorResponse(res, 'Exam not found.', 404);
            }

            const canAttempt = exam.canUserAttempt(user._id);
            if (!canAttempt.allowed) {
              return sendErrorResponse(res, canAttempt.reason, 403);
            }
          }
          break;

        case 'result':
          // Students can only access their own results
          if (user.role === 'student') {
            const Result = (await import('../models/Result.js')).default;
            const result = await Result.findById(resourceId);
            
            if (!result) {
              return sendErrorResponse(res, 'Result not found.', 404);
            }

            if (result.student.toString() !== user._id.toString()) {
              return sendErrorResponse(res, 'Access denied. You can only access your own results.', 403);
            }
          }
          break;

        case 'user':
          // Users can only access their own profile unless admin
          if (user.role !== 'admin' && resourceId !== user._id.toString()) {
            return sendErrorResponse(res, 'Access denied. You can only access your own profile.', 403);
          }
          break;

        default:
          break;
      }

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      return sendErrorResponse(res, 'Server error during access check.', 500);
    }
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next(); // No token, continue without user
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
      return next(); // Invalid format, continue without user
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
        req.token = token;
      }
    } catch (jwtError) {
      // Token invalid or expired, continue without user
    }

    next();
  } catch (error) {
    // On any error, continue without user
    next();
  }
};

// Rate limiting by user
export const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    }

    const userRequests = requests.get(userId) || [];

    if (userRequests.length >= maxRequests) {
      return sendErrorResponse(res, 'Too many requests. Please try again later.', 429);
    }

    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

// Check if user has specific permission
export const hasPermission = (permission) => {
  return (req, res, next) => {
    const { user } = req;
    
    if (!user) {
      return sendErrorResponse(res, 'Authentication required.', 401);
    }

    // Admin has all permissions
    if (user.role === 'admin') {
      return next();
    }

    // Check role-specific permissions
    const permissions = {
      instructor: [
        'view_exams',
        'grade_exams',
        'view_results',
        'create_questions',
        'view_students'
      ],
      student: [
        'take_exams',
        'view_own_results',
        'view_exam_schedule'
      ]
    };

    const userPermissions = permissions[user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return sendErrorResponse(res, `Insufficient permissions. Required: ${permission}`, 403);
    }

    next();
  };
};

// Middleware to ensure user owns resource or is admin
export const ensureOwnership = (resourceModel, resourceIdParam = 'id', userField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const resourceId = req.params[resourceIdParam];

      if (!user) {
        return sendErrorResponse(res, 'Authentication required.', 401);
      }

      // Admin can access anything
      if (user.role === 'admin') {
        return next();
      }

      // Import the model dynamically
      const Model = (await import(`../models/${resourceModel}.js`)).default;
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return sendErrorResponse(res, `${resourceModel} not found.`, 404);
      }

      // Check ownership
      const ownerId = resource[userField];
      if (!ownerId || ownerId.toString() !== user._id.toString()) {
        return sendErrorResponse(res, 'Access denied. You can only modify your own resources.', 403);
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return sendErrorResponse(res, 'Server error during ownership check.', 500);
    }
  };
};

export default {
  authenticate,
  authorize,
  adminOnly,
  instructorOrAdmin,
  studentOnly,
  checkResourceAccess,
  optionalAuth,
  rateLimitByUser,
  hasPermission,
  ensureOwnership
};