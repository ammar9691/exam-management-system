/**
 * Authentication Routes
 * Handles authentication-related endpoints
 */

import express from 'express';
import authController from '../controllers/authController.js';
import { userValidations, commonValidations, handleValidationErrors } from '../utils/validation.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { avatarUpload, handleUploadError, processUploadedFiles, getUploadUrl } from '../utils/upload.js';
import { sendValidationErrorResponse } from '../utils/response.js';

const router = express.Router();

// Public routes (no authentication required)

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', userValidations.register, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', userValidations.login, authController.login);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
  commonValidations.email,
  handleValidationErrors
], authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  commonValidations.requiredString('token', 32, 64),
  commonValidations.password,
  handleValidationErrors
], authController.resetPassword);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', [
  commonValidations.objectId('token').optional()
], authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', [
  commonValidations.email,
  handleValidationErrors
], authController.resendVerificationEmail);

// Protected routes (authentication required)

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, authController.logout);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, authController.getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  authenticate, 
  userValidations.updateProfile, 
  authController.updateProfile
);

// @route   PUT /api/auth/profile/avatar
// @desc    Update user avatar
// @access  Private
router.put('/profile/avatar',
  authenticate,
  avatarUpload.single('avatar'),
  handleUploadError,
  processUploadedFiles,
  (req, res) => {
    if (!req.file) {
      return sendValidationErrorResponse(res, [{ field: 'avatar', message: 'Avatar image is required' }]);
    }
    
    // Update user's avatar path
    const avatarUrl = getUploadUrl(req.uploadedFiles[0].relativePath);
    req.body.avatar = avatarUrl;
    
    authController.updateProfile(req, res);
  }
);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', 
  authenticate, 
  userValidations.changePassword, 
  authController.changePassword
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', authenticate, authController.refreshToken);

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', 
  authenticate,
  [
    commonValidations.array('subjects').optional(),
    commonValidations.optionalString('theme', 20),
    commonValidations.optionalString('language', 10),
    handleValidationErrors
  ],
  authController.updatePreferences
);

// @route   GET /api/auth/sessions
// @desc    Get user sessions
// @access  Private
router.get('/sessions', authenticate, authController.getSessions);

// @route   DELETE /api/auth/sessions/:sessionId
// @desc    Revoke a user session
// @access  Private
router.delete('/sessions/:sessionId', 
  authenticate,
  [
    commonValidations.objectId('sessionId'),
    handleValidationErrors
  ],
  authController.revokeSession
);

// Optional authentication routes (work with or without token)

// @route   GET /api/auth/me
// @desc    Get current user info if authenticated, null otherwise
// @access  Public/Private (optional auth)
router.get('/me', optionalAuth, (req, res) => {
  if (req.user) {
    return authController.getProfile(req, res);
  }
  
  res.json({
    status: 'success',
    message: 'No authenticated user',
    data: { user: null }
  });
});

// Route parameter validation middleware
router.param('token', (req, res, next, token) => {
  if (!token || token.length < 32) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid token format',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

router.param('sessionId', (req, res, next, sessionId) => {
  if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid session ID format',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

export default router;