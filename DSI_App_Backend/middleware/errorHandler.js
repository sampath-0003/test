// Global error handling middleware
import { ROLES } from '../constants/roles.js';

// Standard response format
export const standardResponse = (res, success, message, data = null, statusCode = 200) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
};

// Error response format
export const errorResponse = (res, message, statusCode = 500, errorId = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    ...(errorId && { errorId })
  };
  return res.status(statusCode).json(response);
};

// Validation error response
export const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

// Not found error response
export const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`,
    timestamp: new Date().toISOString()
  });
};

// Unauthorized error response
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// Forbidden error response
export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Global Error Handler:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return validationErrorResponse(res, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `${field} already exists`, 400);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return errorResponse(res, 'Invalid ID format', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return unauthorizedResponse(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return unauthorizedResponse(res, 'Token expired');
  }

  // Default error
  return errorResponse(res, 'Internal server error', 500);
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Role-based access control helper
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return unauthorizedResponse(res, 'User role not found');
    }

    if (!allowedRoles.includes(userRole)) {
      return forbiddenResponse(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

// Organization access control helper
export const requireOrganizationAccess = (req, res, next) => {
  const userOrgId = req.user?.organizationId;
  const targetOrgId = req.params.organizationId || req.body.organizationId;

  if (!userOrgId) {
    return unauthorizedResponse(res, 'Organization context not found');
  }

  if (targetOrgId && userOrgId !== targetOrgId) {
    return forbiddenResponse(res, 'Access denied to this organization');
  }

  next();
};
