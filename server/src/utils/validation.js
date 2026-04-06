const Joi = require('joi');
const { ValidationError } = './errorHandler';

// Common validation schemas
const schemas = {
  // User schemas
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(4)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 4 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters'
      }),
    avatar: Joi.string()
      .max(10)
      .optional()
      .messages({
        'string.max': 'Avatar must not exceed 10 characters'
      })
  }),

  // Game schemas
  createRoom: Joi.object({
    mode: Joi.string()
      .valid('single', 'multiplayer')
      .default('multiplayer'),
    timeLimit: Joi.number()
      .integer()
      .min(30)
      .max(300)
      .default(60),
    totalQuestions: Joi.number()
      .integer()
      .min(5)
      .max(50)
      .default(10),
    classId: Joi.number()
      .integer()
      .positive()
      .optional(),
    levelId: Joi.string()
      .optional()
  }),

  joinRoom: Joi.object({
    code: Joi.string()
      .pattern(/^[A-Z0-9]{6}$/)
      .required()
      .messages({
        'string.pattern.base': 'Room code must be 6 characters long (letters and numbers only)',
        'any.required': 'Room code is required'
      })
  }),

  submitAnswer: Joi.object({
    roomCode: Joi.string()
      .pattern(/^[A-Z0-9]{6}$/)
      .required(),
    answer: Joi.number()
      .integer()
      .required()
      .messages({
        'any.required': 'Answer is required'
      })
  }),

  gameResult: Joi.object({
    mode: Joi.string()
      .valid('single', 'multiplayer')
      .required(),
    classId: Joi.number()
      .integer()
      .positive()
      .optional(),
    levelId: Joi.string()
      .optional(),
    playerScore: Joi.number()
      .integer()
      .min(0)
      .required(),
    opponentScore: Joi.number()
      .integer()
      .min(0)
      .default(0),
    totalQuestions: Joi.number()
      .integer()
      .min(1)
      .required(),
    streak: Joi.number()
      .integer()
      .min(0)
      .default(0),
    accuracy: Joi.number()
      .min(0)
      .max(100)
      .default(0),
    duration: Joi.number()
      .integer()
      .min(0)
      .optional(),
    won: Joi.boolean()
      .required()
  }),

  getQuestion: Joi.object({
    classId: Joi.number()
      .integer()
      .positive()
      .optional(),
    levelId: Joi.string()
      .optional()
  }),

  // Leaderboard schemas
  leaderboardQuery: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(50),
    offset: Joi.number()
      .integer()
      .min(0)
      .default(0)
  }),

  // General query schemas
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
  }),

  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format'
    })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : 
                 source === 'query' ? req.query : 
                 source === 'params' ? req.params : req;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const validationError = new ValidationError('Validation failed', details);
      
      // Log validation error
      console.warn('Validation error', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        validationErrors: details
      });

      return next(validationError);
    }

    // Replace the original data with validated data
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;

    next();
  };
};

// Custom validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

const validatePassword = (password) => {
  // Basic password validation - can be enhanced
  return password && password.length >= 4 && password.length <= 128;
};

const validateRoomCode = (code) => {
  const roomCodeRegex = /^[A-Z0-9]{6}$/;
  return roomCodeRegex.test(code);
};

// Sanitization functions
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const sanitizeNumber = (num) => {
  const parsed = parseInt(num);
  return isNaN(parsed) ? null : parsed;
};

const sanitizeEmail = (email) => {
  const sanitized = sanitizeString(email).toLowerCase();
  return validateEmail(sanitized) ? sanitized : null;
};

// Input sanitization middleware
const sanitize = (fields = []) => {
  return (req, res, next) => {
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;

      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'number') {
          sanitized[key] = sanitizeNumber(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'object' ? sanitizeObject(item) : item
          );
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateEmail,
  validateUsername,
  validatePassword,
  validateRoomCode,
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  sanitize
};
