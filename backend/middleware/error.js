/**
 * Error handling middleware for the application
 */

// Async handler wrapper to catch async errors
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response helper
export const sendErrorResponse = (res, statusCode, message, error = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error.message;
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error
  let error = {
    status: 'error',
    message: 'Internal server error',
    statusCode: 500,
    timestamp: new Date().toISOString()
  };
  
  // Handle specific error types
  if (err instanceof AppError) {
    error.message = err.message;
    error.statusCode = err.statusCode;
  }
  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    error.statusCode = 400;
  }
  // Mongoose duplicate key error
  else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error.message = `${field} already exists`;
    error.statusCode = 409;
  }
  // Mongoose cast error
  else if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    error.statusCode = 400;
  }
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }
  else if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }
  // Handle other known errors
  else if (err.statusCode) {
    error.message = err.message;
    error.statusCode = err.statusCode;
  }
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }
  
  // Send error response
  res.status(error.statusCode).json(error);
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Validation error helper
export const createValidationError = (message) => {
  return new AppError(message, 400);
};

// Authorization error helper
export const createAuthError = (message = 'Not authorized') => {
  return new AppError(message, 401);
};

// Forbidden error helper
export const createForbiddenError = (message = 'Access denied') => {
  return new AppError(message, 403);
};

// Not found error helper
export const createNotFoundError = (message = 'Resource not found') => {
  return new AppError(message, 404);
};

// Server error helper
export const createServerError = (message = 'Internal server error') => {
  return new AppError(message, 500);
};