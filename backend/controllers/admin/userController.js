/**
 * Admin User Controller
 * Handles admin-specific user management operations
 */

import User from '../../models/User.js';
import Question from '../../models/Question.js';
import Exam from '../../models/Exam.js';
import Result from '../../models/Result.js';
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
    defaultSort: { createdAt: -1 }
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

// Get comprehensive dashboard overview
export const getDashboardOverview = asyncHandler(async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          instructors: { $sum: { $cond: [{ $eq: ['$role', 'instructor'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
        }
      }
    ]);

    // Get question statistics
    const questionStats = await Question.aggregate([
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          activeQuestions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          easyQuestions: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
          mediumQuestions: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
          hardQuestions: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } }
        }
      }
    ]);

    // Get exam statistics
    const examStats = await Exam.aggregate([
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          activeExams: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completedExams: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          draftExams: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
        }
      }
    ]);

    // Get result statistics
    const resultStats = await Result.aggregate([
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          completedResults: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageScore: { $avg: '$scoring.percentage' },
          passRate: {
            $avg: { $cond: [{ $eq: ['$scoring.passed', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get monthly registration data
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
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

    const stats = {
      totalUsers: userStats[0]?.totalUsers || 0,
      activeUsers: userStats[0]?.activeUsers || 0,
      students: userStats[0]?.students || 0,
      instructors: userStats[0]?.instructors || 0,
      admins: userStats[0]?.admins || 0,
      totalQuestions: questionStats[0]?.totalQuestions || 0,
      activeQuestions: questionStats[0]?.activeQuestions || 0,
      totalExams: examStats[0]?.totalExams || 0,
      activeExams: examStats[0]?.activeExams || 0,
      totalResults: resultStats[0]?.totalResults || 0,
      averageScore: Math.round(resultStats[0]?.averageScore || 0),
      passRate: Math.round((resultStats[0]?.passRate || 0) * 100),
      monthlyRegistrations
    };

    sendSuccessResponse(res, 'Dashboard overview retrieved successfully', { stats });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    sendErrorResponse(res, 'Error retrieving dashboard data', 500);
  }
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
  getUserActivity,
  getDashboardOverview
};
