/**
 * Standardized API response utility functions
 */

// Send success response
export const sendSuccessResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  const response = {
    status: 'success',
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Send error response
export const sendErrorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Send paginated response
export const sendPaginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  const response = {
    status: 'success',
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPreviousPage: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

// Send validation error response
export const sendValidationErrorResponse = (res, errors) => {
  const formattedErrors = Array.isArray(errors) 
    ? errors.map(error => ({
        field: error.path || error.param,
        message: error.msg || error.message,
        value: error.value
      }))
    : [{ message: errors.message || errors }];

  return sendErrorResponse(res, 'Validation failed', 400, formattedErrors);
};

// Send authentication error
export const sendAuthErrorResponse = (res, message = 'Authentication failed') => {
  return sendErrorResponse(res, message, 401);
};

// Send authorization error
export const sendAuthorizationErrorResponse = (res, message = 'Access denied') => {
  return sendErrorResponse(res, message, 403);
};

// Send not found error
export const sendNotFoundResponse = (res, resource = 'Resource') => {
  return sendErrorResponse(res, `${resource} not found`, 404);
};

// Send conflict error
export const sendConflictResponse = (res, message = 'Resource already exists') => {
  return sendErrorResponse(res, message, 409);
};

// Send server error
export const sendServerErrorResponse = (res, message = 'Internal server error', error = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return res.status(500).json(response);
};

// Send rate limit error
export const sendRateLimitResponse = (res, message = 'Too many requests') => {
  return sendErrorResponse(res, message, 429);
};

// Send maintenance mode response
export const sendMaintenanceResponse = (res, message = 'System is under maintenance') => {
  return sendErrorResponse(res, message, 503);
};

// Generic response handler for async operations
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Format mongoose validation errors
export const formatMongooseErrors = (error) => {
  const errors = [];
  
  if (error.errors) {
    Object.keys(error.errors).forEach(key => {
      const err = error.errors[key];
      errors.push({
        field: key,
        message: err.message,
        value: err.value,
        type: err.kind
      });
    });
  } else if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    errors.push({
      field,
      message: `${field} already exists`,
      type: 'unique'
    });
  }
  
  return errors;
};

export default {
  sendSuccessResponse,
  sendErrorResponse,
  sendPaginatedResponse,
  sendValidationErrorResponse,
  sendAuthErrorResponse,
  sendAuthorizationErrorResponse,
  sendNotFoundResponse,
  sendConflictResponse,
  sendServerErrorResponse,
  sendRateLimitResponse,
  sendMaintenanceResponse,
  asyncHandler,
  formatMongooseErrors
};