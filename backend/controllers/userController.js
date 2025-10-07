/**
 * User Controller
 * Handles user management operations
 */

import User from '../models/User.js';
import { 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendNotFoundResponse,
  sendValidationErrorResponse,
  sendPaginatedResponse,
  formatMongooseErrors,
  asyncHandler
} from '../utils/response.js';
import { getPaginatedResults } from '../utils/pagination.js';

// Get all users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['name', 'email', 'profile.phone'],
    allowedFilters: ['role', 'status', 'createdFrom', 'createdTo'],
    select: '-password -security',
    defaultSort: { createdAt: -1 },
    populate: [
      { path: 'preferences.subjects', select: 'name code' }
    ]
  };

  const result = await getPaginatedResults(User, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Users retrieved successfully');
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id)
    .populate('preferences.subjects', 'name code')
    .select('-password -security');
    
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  sendSuccessResponse(res, 'User retrieved successfully', { user });
});

// Create new user (admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, status = 'active' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendErrorResponse(res, 'User already exists with this email', 409);
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
    role,
    status,
    profile: { phone }
  });

  await user.save();

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.security;

  sendSuccessResponse(res, 'User created successfully', { user: userResponse }, 201);
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, phone, bio } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Check if email is being changed and already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, 'Email already exists', 409);
    }
    user.email = email;
  }

  // Update fields
  if (name) user.name = name;
  if (role) user.role = role;
  if (status) user.status = status;
  if (phone) user.profile.phone = phone;
  if (bio) user.profile.bio = bio;

  user.updatedAt = new Date();
  await user.save();

  // Remove sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.security;

  sendSuccessResponse(res, 'User updated successfully', { user: userResponse });
});

// Delete user (soft delete)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Soft delete by setting status to deleted
  user.status = 'deleted';
  user.updatedAt = new Date();
  await user.save();

  sendSuccessResponse(res, 'User deleted successfully');
});

// Permanently delete user (admin only)
export const permanentlyDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  sendSuccessResponse(res, 'User permanently deleted');
});

// Restore deleted user
export const restoreUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  if (user.status !== 'deleted') {
    return sendErrorResponse(res, 'User is not deleted', 400);
  }

  user.status = 'active';
  user.updatedAt = new Date();
  await user.save();

  sendSuccessResponse(res, 'User restored successfully');
});

// Update user status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  user.status = status;
  user.updatedAt = new Date();
  await user.save();

  sendSuccessResponse(res, 'User status updated successfully', { 
    user: { id: user._id, status: user.status } 
  });
});

// Update user role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  user.role = role;
  user.updatedAt = new Date();
  await user.save();

  sendSuccessResponse(res, 'User role updated successfully', { 
    user: { id: user._id, role: user.role } 
  });
});

// Get users by role
export const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  
  const options = {
    searchFields: ['name', 'email'],
    select: '-password -security',
    defaultSort: { name: 1 }
  };

  // Add role filter to request query
  req.query.role = role;
  
  const result = await getPaginatedResults(User, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, `${role}s retrieved successfully`);
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
        admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
      }
    }
  ]);

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  const result = {
    ...stats[0],
    recentRegistrations
  };

  sendSuccessResponse(res, 'User statistics retrieved successfully', { stats: result });
});

// Get user activity summary
export const getUserActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id).select('stats security.lastLogin');
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // This would be expanded to include more activity data from other collections
  const activity = {
    loginCount: user.stats.loginCount,
    lastLogin: user.security.lastLogin,
    // TODO: Add exam attempts, question submissions, etc.
    examAttempts: 0,
    questionsAnswered: 0,
    averageScore: 0
  };

  sendSuccessResponse(res, 'User activity retrieved successfully', { activity });
});

// Search users
export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim().length === 0) {
    return sendErrorResponse(res, 'Search query is required', 400);
  }

  const searchRegex = new RegExp(query, 'i');
  
  const users = await User.find({
    $or: [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } },
      { 'profile.phone': { $regex: searchRegex } }
    ],
    status: { $ne: 'deleted' }
  })
  .select('-password -security')
  .limit(20)
  .sort({ name: 1 });

  sendSuccessResponse(res, 'Search results retrieved successfully', { users });
});

// Get user dashboard data
export const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const user = await User.findById(userId)
    .populate('preferences.subjects', 'name code')
    .select('-password -security');
    
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // TODO: Aggregate dashboard data from other collections
  const dashboardData = {
    profile: user,
    stats: {
      examsTaken: 0,
      averageScore: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      currentStreak: 0
    },
    recentExams: [],
    upcomingExams: [],
    achievements: []
  };

  sendSuccessResponse(res, 'Dashboard data retrieved successfully', dashboardData);
});

// Export user data (GDPR compliance)
export const exportUserData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Remove sensitive fields but keep all other data
  const userData = user.toObject();
  delete userData.password;
  delete userData.security.passwordResetToken;
  delete userData.security.emailVerificationToken;

  // TODO: Include data from other collections (exams, results, etc.)
  const exportData = {
    userData,
    examResults: [],
    examAttempts: [],
    questionSubmissions: []
  };

  sendSuccessResponse(res, 'User data exported successfully', exportData);
});

// Bulk operations
export const bulkUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, updates } = req.body;
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return sendErrorResponse(res, 'User IDs array is required', 400);
  }

  const allowedUpdates = ['status', 'role'];
  const updateData = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = updates[key];
    }
  });

  if (Object.keys(updateData).length === 0) {
    return sendErrorResponse(res, 'No valid update fields provided', 400);
  }

  updateData.updatedAt = new Date();

  const result = await User.updateMany(
    { _id: { $in: userIds } },
    { $set: updateData }
  );

  sendSuccessResponse(res, 'Users updated successfully', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
});

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  permanentlyDeleteUser,
  restoreUser,
  updateUserStatus,
  updateUserRole,
  getUsersByRole,
  getUserStats,
  getUserActivity,
  searchUsers,
  getUserDashboard,
  exportUserData,
  bulkUpdateUsers
};