/**
 * Validation utility functions
 */

import { body, param, query, validationResult } from 'express-validator';
import { sendValidationErrorResponse } from './response.js';

// Validation error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidationErrorResponse(res, errors.array());
  }
  next();
};

// Common validation rules
export const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Name validation
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  // MongoDB ObjectId validation
  objectId: (field) => param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} ID`),

  // Required string field
  requiredString: (field, min = 1, max = 500) => body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`),

  // Optional string field
  optionalString: (field, max = 500) => body(field)
    .optional()
    .trim()
    .isLength({ max })
    .withMessage(`${field} must be less than ${max} characters`),

  // Number validation
  number: (field, min = 0) => body(field)
    .isNumeric()
    .withMessage(`${field} must be a number`)
    .isFloat({ min })
    .withMessage(`${field} must be at least ${min}`),

  // Boolean validation
  boolean: (field) => body(field)
    .isBoolean()
    .withMessage(`${field} must be true or false`),

  // Array validation
  array: (field) => body(field)
    .isArray()
    .withMessage(`${field} must be an array`),

  // Date validation
  date: (field) => body(field)
    .isISO8601()
    .withMessage(`${field} must be a valid date`)
    .toDate(),

  // URL validation
  url: (field) => body(field)
    .isURL()
    .withMessage(`${field} must be a valid URL`),

  // Phone validation
  phone: body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  // Sort validation
  sort: query('sort')
    .optional()
    .matches(/^[-]?[a-zA-Z_]+$/)
    .withMessage('Invalid sort parameter'),

  // Search validation
  search: query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  // Status validation
  status: (validStatuses) => body('status')
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(', ')}`),

  // Role validation
  role: (validRoles) => body('role')
    .isIn(validRoles)
    .withMessage(`Role must be one of: ${validRoles.join(', ')}`),

  // File validation (for multer)
  fileType: (allowedTypes) => (req, res, next) => {
    if (req.file && !allowedTypes.includes(req.file.mimetype)) {
      return sendValidationErrorResponse(res, [{
        field: 'file',
        message: `File type must be one of: ${allowedTypes.join(', ')}`
      }]);
    }
    next();
  },

  fileSize: (maxSize) => (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return sendValidationErrorResponse(res, [{
        field: 'file',
        message: `File size must be less than ${maxSize / 1024 / 1024}MB`
      }]);
    }
    next();
  }
};

// User validation chains
export const userValidations = {
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.phone,
    body('role').optional().isIn(['student', 'instructor', 'admin']).withMessage('Invalid role'),
    handleValidationErrors
  ],

  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],

  updateProfile: [
    commonValidations.optionalString('name', 50),
    commonValidations.phone,
    commonValidations.optionalString('bio', 500),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    commonValidations.password,
    handleValidationErrors
  ]
};

// Question validation chains
export const questionValidations = {
  create: [
    commonValidations.requiredString('text', 10, 1000),
    body('type').isIn(['multiple-choice', 'true-false', 'short-answer', 'essay']).withMessage('Invalid question type'),
    commonValidations.requiredString('subject', 2, 100),
    commonValidations.requiredString('topic', 2, 100),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
    commonValidations.number('marks', 0.5),
    body('options').optional().isArray().withMessage('Options must be an array'),
    commonValidations.optionalString('explanation', 1000),
    handleValidationErrors
  ],

  update: [
    commonValidations.objectId('id'),
    commonValidations.optionalString('text', 10, 1000),
    body('type').optional().isIn(['multiple-choice', 'true-false', 'short-answer', 'essay']).withMessage('Invalid question type'),
    commonValidations.optionalString('subject', 2, 100),
    commonValidations.optionalString('topic', 2, 100),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
    body('marks').optional().isNumeric().isFloat({ min: 0.5 }).withMessage('Marks must be at least 0.5'),
    body('options').optional().isArray().withMessage('Options must be an array'),
    commonValidations.optionalString('explanation', 1000),
    handleValidationErrors
  ]
};

// Exam validation chains
export const examValidations = {
  create: [
    commonValidations.requiredString('title', 5, 200),
    commonValidations.optionalString('description', 1000),
    commonValidations.requiredString('subject', 2, 100),
    body('type').isIn(['practice', 'assignment', 'midterm', 'final', 'quiz']).withMessage('Invalid exam type'),
    commonValidations.number('duration', 1),
    commonValidations.number('totalMarks', 1),
    body('questions').isArray().withMessage('Questions must be an array'),
    body('startTime').isISO8601().withMessage('Start time must be a valid date').toDate(),
    body('endTime').isISO8601().withMessage('End time must be a valid date').toDate(),
    handleValidationErrors
  ],

  update: [
    commonValidations.objectId('id'),
    commonValidations.optionalString('title', 5, 200),
    commonValidations.optionalString('description', 1000),
    commonValidations.optionalString('subject', 2, 100),
    body('type').optional().isIn(['practice', 'assignment', 'midterm', 'final', 'quiz']).withMessage('Invalid exam type'),
    body('duration').optional().isNumeric().isFloat({ min: 1 }).withMessage('Duration must be at least 1 minute'),
    body('totalMarks').optional().isNumeric().isFloat({ min: 1 }).withMessage('Total marks must be at least 1'),
    body('questions').optional().isArray().withMessage('Questions must be an array'),
    body('startTime').optional().isISO8601().withMessage('Start time must be a valid date').toDate(),
    body('endTime').optional().isISO8601().withMessage('End time must be a valid date').toDate(),
    handleValidationErrors
  ]
};

// Subject validation chains
export const subjectValidations = {
  create: [
    commonValidations.requiredString('name', 2, 100),
    commonValidations.optionalString('description', 500),
    commonValidations.requiredString('code', 2, 20),
    commonValidations.number('credits', 1),
    handleValidationErrors
  ],

  update: [
    commonValidations.objectId('id'),
    commonValidations.optionalString('name', 2, 100),
    commonValidations.optionalString('description', 500),
    commonValidations.optionalString('code', 2, 20),
    body('credits').optional().isNumeric().isFloat({ min: 1 }).withMessage('Credits must be at least 1'),
    handleValidationErrors
  ]
};

// Pagination validation
export const paginationValidation = [
  commonValidations.page,
  commonValidations.limit,
  commonValidations.sort,
  commonValidations.search
];

// Custom validation functions
export const customValidations = {
  // Check if end time is after start time
  endTimeAfterStart: body('endTime').custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.startTime)) {
      throw new Error('End time must be after start time');
    }
    return true;
  }),

  // Check if exam questions exist
  questionsExist: body('questions.*.questionId').custom(async (value) => {
    const Question = (await import('../models/Question.js')).default;
    const question = await Question.findById(value);
    if (!question) {
      throw new Error(`Question with ID ${value} does not exist`);
    }
    return true;
  }),

  // Check password confirmation
  confirmPassword: body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
};

export default {
  handleValidationErrors,
  commonValidations,
  userValidations,
  questionValidations,
  examValidations,
  subjectValidations,
  paginationValidation,
  customValidations
};