/**
 * User Routes
 * Handles user management endpoints
 */

import express from 'express';
import userController from '../controllers/userController.js';
import { userValidations, commonValidations, paginationValidation, handleValidationErrors } from '../utils/validation.js';
import { authenticate, authorize, hasPermission, checkResourceAccess } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', 
  authorize('admin'), 
  paginationValidation,
  userController.getAllUsers
);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', 
  authorize('admin'), 
  userController.getUserStats
);

// @route   GET /api/users/search
// @desc    Search users
// @access  Private (Admin/Instructor)
router.get('/search', 
  authorize('admin', 'instructor'), 
  userController.searchUsers
);

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', userController.getUserDashboard);

// @route   GET /api/users/role/:role
// @desc    Get users by role
// @access  Private (Admin/Instructor)
router.get('/role/:role', 
  authorize('admin', 'instructor'),
  [
    commonValidations.status(['student', 'instructor', 'admin']).optional(),
    ...paginationValidation
  ],
  userController.getUsersByRole
);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', 
  authorize('admin'),
  [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.role(['student', 'instructor', 'admin']),
    commonValidations.phone,
    commonValidations.status(['active', 'inactive', 'pending']).optional(),
    handleValidationErrors
  ],
  userController.createUser
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own profile)
router.get('/:id', 
  checkResourceAccess('user'),
  [
    commonValidations.objectId('id'),
    handleValidationErrors
  ],
  userController.getUserById
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own profile)
router.put('/:id', 
  checkResourceAccess('user'),
  [
    commonValidations.objectId('id'),
    commonValidations.optionalString('name', 50),
    commonValidations.email.optional(),
    commonValidations.role(['student', 'instructor', 'admin']).optional(),
    commonValidations.status(['active', 'inactive', 'pending', 'deleted']).optional(),
    commonValidations.phone,
    commonValidations.optionalString('bio', 500),
    handleValidationErrors
  ],
  userController.updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', 
  authorize('admin'),
  [
    commonValidations.objectId('id'),
    handleValidationErrors
  ],
  userController.deleteUser
);

// @route   DELETE /api/users/:id/permanent
// @desc    Permanently delete user
// @access  Private (Admin only)
router.delete('/:id/permanent', 
  authorize('admin'),
  [
    commonValidations.objectId('id'),
    handleValidationErrors
  ],
  userController.permanentlyDeleteUser
);

// @route   POST /api/users/:id/restore
// @desc    Restore deleted user
// @access  Private (Admin only)
router.post('/:id/restore', 
  authorize('admin'),
  [
    commonValidations.objectId('id'),
    handleValidationErrors
  ],
  userController.restoreUser
);

// @route   PATCH /api/users/:id/status
// @desc    Update user status
// @access  Private (Admin only)
router.patch('/:id/status', 
  authorize('admin'),
  [
    commonValidations.objectId('id'),
    commonValidations.status(['active', 'inactive', 'pending', 'deleted']),
    handleValidationErrors
  ],
  userController.updateUserStatus
);

// @route   PATCH /api/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.patch('/:id/role', 
  authorize('admin'),
  [
    commonValidations.objectId('id'),
    commonValidations.role(['student', 'instructor', 'admin']),
    handleValidationErrors
  ],
  userController.updateUserRole
);

// @route   GET /api/users/:id/activity
// @desc    Get user activity summary
// @access  Private (Admin or own profile)
router.get('/:id/activity', 
  checkResourceAccess('user'),
  [
    commonValidations.objectId('id'),
    handleValidationErrors
  ],
  userController.getUserActivity
);

// @route   GET /api/users/:id/export
// @desc    Export user data
// @access  Private (Admin or own profile)
router.get('/:id/export', 
  checkResourceAccess('user'),
  [
    commonValidations.objectId('id'),
    handleValidationErrors
  ],
  userController.exportUserData
);

// @route   PUT /api/users/bulk
// @desc    Bulk update users
// @access  Private (Admin only)
router.put('/bulk', 
  authorize('admin'),
  [
    commonValidations.array('userIds'),
    commonValidations.status(['active', 'inactive', 'pending', 'deleted']).optional(),
    commonValidations.role(['student', 'instructor', 'admin']).optional(),
    handleValidationErrors
  ],
  userController.bulkUpdateUsers
);

// Route parameter validation
router.param('id', (req, res, next, id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID format',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

router.param('role', (req, res, next, role) => {
  const validRoles = ['student', 'instructor', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

export default router;
