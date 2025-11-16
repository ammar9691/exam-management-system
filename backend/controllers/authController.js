/**
 * Authentication Controller
 * Handles user authentication operations
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import config from '../config.js';
import { 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendAuthErrorResponse,
  sendValidationErrorResponse,
  sendNotFoundResponse,
  formatMongooseErrors,
  asyncHandler
} from '../utils/response.js';

// Register new user
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'student', phone } = req.body;

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
    profile: { phone }
  });

  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.security;

  sendSuccessResponse(res, 'User registered successfully', {
    user: userResponse,
    token
  }, 201);
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password +security.loginAttempts +security.lockUntil');
  
  if (!user) {
    return sendAuthErrorResponse(res, 'Invalid credentials');
  }

  // Check if account is locked
  if (user.isLocked) {
    return sendAuthErrorResponse(res, 'Account temporarily locked due to multiple failed login attempts');
  }

  // Check password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    await user.incLoginAttempts();
    return sendAuthErrorResponse(res, 'Invalid credentials');
  }

  // Check if user is active
  if (user.status !== 'active') {
    return sendAuthErrorResponse(res, 'Account is not active');
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  
  // Update last login info
  user.security.lastLogin = new Date();
  user.security.lastLoginIP = req.ip || req.connection.remoteAddress;
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.security;

  sendSuccessResponse(res, 'Login successful', {
    user: userResponse,
    token
  });
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can add token blacklisting here if needed
  sendSuccessResponse(res, 'Logout successful');
});

// Get current user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('preferences.subjects', 'name code')
    .select('-password -security');

  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  sendSuccessResponse(res, 'Profile retrieved successfully', { user });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio, avatar, dateOfBirth, gender, address } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Update basic info
  if (name) user.name = name;
  
  // Update profile
  if (phone) user.profile.phone = phone;
  if (bio) user.profile.bio = bio;
  if (avatar) user.profile.avatar = avatar;
  if (dateOfBirth) user.profile.dateOfBirth = dateOfBirth;
  if (gender) user.profile.gender = gender;
  if (address) user.profile.address = address;

  user.updatedAt = new Date();
  await user.save();

  // Remove sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.security;

  sendSuccessResponse(res, 'Profile updated successfully', { user: userResponse });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Verify current password
  const isValidPassword = await user.comparePassword(currentPassword);
  if (!isValidPassword) {
    return sendAuthErrorResponse(res, 'Current password is incorrect');
  }

  // Update password
  user.password = password;
  user.security.passwordChangedAt = new Date();
  await user.save();

  sendSuccessResponse(res, 'Password changed successfully');
});

// Forgot password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    return sendSuccessResponse(res, 'If the email exists, a reset link will be sent');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.security.passwordResetToken = hashedToken;
  user.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // TODO: Send email with reset token
  // For now, we'll just return success (in production, implement email service)
  console.log(`Password reset token for ${email}: ${resetToken}`);

  sendSuccessResponse(res, 'Password reset link sent to your email');
});

// Reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    'security.passwordResetToken': hashedToken,
    'security.passwordResetExpires': { $gt: Date.now() }
  });

  if (!user) {
    return sendAuthErrorResponse(res, 'Invalid or expired reset token');
  }

  // Update password
  user.password = password;
  user.security.passwordResetToken = undefined;
  user.security.passwordResetExpires = undefined;
  user.security.passwordChangedAt = new Date();
  await user.save();

  // Generate new JWT token
  const jwtToken = user.generateAuthToken();

  // Remove sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.security;

  sendSuccessResponse(res, 'Password reset successful', {
    user: userResponse,
    token: jwtToken
  });
});

// Verify email (if email verification is implemented)
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    'security.emailVerificationToken': token,
    status: 'pending'
  });

  if (!user) {
    return sendAuthErrorResponse(res, 'Invalid or expired verification token');
  }

  user.status = 'active';
  user.security.emailVerificationToken = undefined;
  user.security.emailVerified = true;
  user.security.emailVerifiedAt = new Date();
  await user.save();

  sendSuccessResponse(res, 'Email verified successfully');
});

// Resend verification email
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email, status: 'pending' });
  if (!user) {
    return sendErrorResponse(res, 'User not found or already verified', 404);
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.security.emailVerificationToken = verificationToken;
  await user.save();

  // TODO: Send verification email
  console.log(`Email verification token for ${email}: ${verificationToken}`);

  sendSuccessResponse(res, 'Verification email sent');
});

// Refresh JWT token
export const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Generate new token
  const token = user.generateAuthToken();

  sendSuccessResponse(res, 'Token refreshed successfully', { token });
});

// Get user sessions (if session tracking is implemented)
export const getSessions = asyncHandler(async (req, res) => {
  // This would require implementing session tracking
  // For now, return empty array
  sendSuccessResponse(res, 'Sessions retrieved successfully', { sessions: [] });
});

// Revoke session (if session tracking is implemented)
export const revokeSession = asyncHandler(async (req, res) => {
  // This would require implementing session tracking
  sendSuccessResponse(res, 'Session revoked successfully');
});

// Update user preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const { subjects, notifications, theme, language } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return sendNotFoundResponse(res, 'User');
  }

  // Update preferences
  if (subjects) user.preferences.subjects = subjects;
  if (notifications) user.preferences.notifications = { ...user.preferences.notifications, ...notifications };
  if (theme) user.preferences.theme = theme;
  if (language) user.preferences.language = language;

  await user.save();

  sendSuccessResponse(res, 'Preferences updated successfully', {
    preferences: user.preferences
  });
});

export default {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  getSessions,
  revokeSession,
  updatePreferences
};