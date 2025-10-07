/**
 * Admin User Controller
 * Handles admin-specific user management operations
 */

import User from '../../models/User.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../../utils/response.js';
import { getPaginatedResults } from '../../utils/pagination.js';
import bcrypt from 'bcryptjs';
import { Parser } from 'json2csv';

// Get all users with advanced filtering
export const getAllUsers = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['name', 'email'],
    allowedFilters: ['role', 'status', 'isEmailVerified', 'createdFrom', 'createdTo'],
    defaultSort: { createdAt: -1 },
    populate: [
      { path: 'createdBy', select: 'name email' }
    ]
  };

  const result = await getPaginatedResults(User, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Users retrieved successfully');
});

// Get user statistics
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactiveUsers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        pendingUsers: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        deletedUsers: { $sum: { $cond: [{ $eq: ['$status', 'deleted'] }, 1, 0] } },
        students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
        instructors: { $sum: { $cond: [{ $eq: ['$role', 'instructor'] }, 1, 0] } },
        admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
        verifiedEmails: { $sum: { $cond: ['$security.isEmailVerified', 1, 0] } }
      }
    }
  ]);

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Get monthly registration data for charts
  const monthlyRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } // Current year
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const result = {
    ...stats[0],
    recentRegistrations,
    monthlyRegistrations
  };

  sendSuccessResponse(res, 'User statistics retrieved successfully', { stats: result });
});

// Create new user
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, status, phone, profile } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendErrorResponse(res, 'User with this email already exists', 409);
  }

  // Create user
  const user = new User({
    name,
    email,
    password,
    role: role || 'student',
    status: status || 'active',
    phone,
    profile: profile || {},
    'security.isEmailVerified': true // Admin-created users are auto-verified
  });

  await user.save();

  // Remove password from response
  const userResponse = user.toJSON();
  delete userResponse.password;

  sendSuccessResponse(res, 'User created successfully', { user: userResponse }, 201);
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, phone, profile } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return sendErrorResponse(res, 'Email already in use', 409);
    }
    user.email = email;
  }

  // Update fields
  if (name) user.name = name;
  if (role) user.role = role;
  if (status) user.status = status;
  if (phone) user.phone = phone;
  if (profile) user.profile = { ...user.profile, ...profile };

  await user.save();

  const userResponse = user.toJSON();
  delete userResponse.password;

  sendSuccessResponse(res, 'User updated successfully', { user: userResponse });
});

// Delete user (soft delete)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Prevent admin from deleting themselves
  if (id === req.user.id) {
    return sendErrorResponse(res, 'Cannot delete your own account', 400);
  }

  user.status = 'deleted';
  await user.save();

  sendSuccessResponse(res, 'User deleted successfully');
});

// Bulk operations
export const bulkUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, action, data } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return sendErrorResponse(res, 'User IDs array is required', 400);
  }

  let updateQuery = {};
  let successMessage = '';

  switch (action) {
    case 'activate':
      updateQuery = { status: 'active' };
      successMessage = 'Users activated successfully';
      break;
    case 'deactivate':
      updateQuery = { status: 'inactive' };
      successMessage = 'Users deactivated successfully';
      break;
    case 'delete':
      updateQuery = { status: 'deleted' };
      successMessage = 'Users deleted successfully';
      break;
    case 'changeRole':
      if (!data.role) {
        return sendErrorResponse(res, 'Role is required for role change', 400);
      }
      updateQuery = { role: data.role };
      successMessage = `Users role changed to ${data.role} successfully`;
      break;
    default:
      return sendErrorResponse(res, 'Invalid action', 400);
  }

  // Prevent admin from affecting their own account in bulk operations
  const filteredUserIds = userIds.filter(id => id !== req.user.id);

  const result = await User.updateMany(
    { _id: { $in: filteredUserIds } },
    updateQuery
  );

  sendSuccessResponse(res, successMessage, { 
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  });
});

// Reset user password
export const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return sendErrorResponse(res, 'Password must be at least 8 characters long', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  user.password = newPassword; // Will be hashed by pre-save middleware
  await user.save();

  sendSuccessResponse(res, 'Password reset successfully');
});

// Export users data
export const exportUsers = asyncHandler(async (req, res) => {
  const { format = 'csv', role, status } = req.query;
  
  let query = {};
  if (role) query.role = role;
  if (status) query.status = status;

  const users = await User.find(query, {
    password: 0,
    'security.passwordResetToken': 0,
    'security.emailVerificationToken': 0
  }).lean();

  if (format === 'csv') {
    const fields = [
      'name', 'email', 'role', 'status', 'phone',
      'createdAt', 'updatedAt', 'security.isEmailVerified',
      'stats.totalExamsTaken', 'stats.averageScore'
    ];
    
    const parser = new Parser({ fields });
    const csv = parser.parse(users);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    return res.send(csv);
  }

  // Default to JSON
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="users.json"');
  res.json(users);
});

// Get user activity summary
export const getUserActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id).select('stats security.lastLogin');
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Get additional activity data (this would be expanded with actual exam/result data)
  const activity = {
    lastLogin: user.security.lastLogin,
    totalExamsTaken: user.stats.totalExamsTaken || 0,
    averageScore: user.stats.averageScore || 0,
    totalTimeSpent: user.stats.totalTimeSpent || 0,
    lastExamDate: user.stats.lastExamDate
  };

  sendSuccessResponse(res, 'User activity retrieved successfully', { activity });
});

export default {
  getAllUsers,
  getUserStats,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  resetUserPassword,
  exportUsers,
  getUserActivity
};