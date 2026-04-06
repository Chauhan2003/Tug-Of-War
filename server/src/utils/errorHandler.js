const logger = require('./logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const response = {
    status: error.status || 'error',
    message: error.message
  };

  // Include request ID for tracking
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  // Include validation details
  if (error.details) {
    response.details = error.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
};

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  logger.error('Error occurred', err, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      error = new ConflictError(`${field} already exists`);
    } else if (err.code === 121) {
      // Document validation failure
      error = new ValidationError('Invalid data format', err.writeErrors);
    } else {
      error = new DatabaseError('Database operation failed', err);
    }
  }

  // Mongoose validation errors (if using Mongoose)
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    error = new ValidationError('Validation failed', details);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Syntax errors (invalid JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ValidationError('Invalid JSON format');
  }

  // Default to 500 if no status code
  if (!error.statusCode) {
    error.statusCode = 500;
    error.isOperational = false;
  }

  // Send error response
  res.status(error.statusCode).json(formatErrorResponse(error, req));
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Process error handlers
const setupProcessErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    console.error('Uncaught Exception! 💥 Shutting down...');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection', err);
    console.error('Unhandled Rejection! 💥 Shutting down...');
    process.exit(1);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  // Handle SIGINT
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  setupProcessErrorHandlers
};
