const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../utils/logger');
const { RateLimitError } = '../utils/errorHandler';

// Rate limiting configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: 'error',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.logSecurity('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.url,
        requestId: req.requestId,
        userId: req.user?.id
      });
      
      res.status(429).json({
        status: 'error',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later',
  true // Skip successful requests
);

const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests, please try again later'
);

const gameLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  30, // 30 requests per minute
  'Too many game requests, please slow down'
);

const createRoomLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  3, // 3 room creations per minute
  'Too many rooms created, please wait before creating another'
);

// Security headers configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim().replace(/[<>]/g, '');
      }
    }
  }

  // Sanitize body parameters
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().replace(/[<>]/g, '');
      }
    }
  }

  next();
};

// IP-based blocking middleware
const ipBlockMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // List of blocked IPs (in production, this would come from a database)
  const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [];
  
  if (blockedIPs.includes(clientIP)) {
    logger.logSecurity('Blocked IP attempted access', {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      requestId: req.requestId
    });
    
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  next();
};

// User agent validation
const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  // Block requests without user agent or with suspicious user agents
  if (!userAgent || userAgent.length < 10) {
    logger.logSecurity('Suspicious user agent blocked', {
      userAgent,
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId
    });
    
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request'
    });
  }
  
  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  // Allow bots for health checks and specific endpoints
  const allowedBotEndpoints = ['/api/health', '/api/stats'];
  const isAllowedEndpoint = allowedBotEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isBot && !isAllowedEndpoint) {
    logger.logSecurity('Bot request blocked', {
      userAgent,
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId
    });
    
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.get('Content-Length');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.logSecurity('Request size exceeded', {
      contentLength,
      maxSize,
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId
    });
    
    return res.status(413).json({
      status: 'error',
      message: 'Request entity too large'
    });
  }
  
  next();
};

// Security middleware composition
const securityMiddleware = [
  helmetConfig,
  ipBlockMiddleware,
  validateUserAgent,
  requestSizeLimiter,
  sanitizeInput,
  generalLimiter
];

module.exports = {
  securityMiddleware,
  authLimiter,
  gameLimiter,
  createRoomLimiter,
  sanitizeInput,
  ipBlockMiddleware,
  validateUserAgent,
  requestSizeLimiter
};
