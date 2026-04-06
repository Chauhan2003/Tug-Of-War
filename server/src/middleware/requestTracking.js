const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Request ID middleware
const requestIdMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Request logging middleware
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log request completion
    logger.logRequest(req, res, responseTime);
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// CORS middleware with enhanced security
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'https://math-tug-of-war.netlify.app'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

// Response security headers
const responseSecurityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check for required headers
  const requiredHeaders = ['content-type'];
  const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);
  
  if (missingHeaders.length > 0 && req.method !== 'GET') {
    logger.warn('Missing required headers', {
      requestId: req.requestId,
      missingHeaders,
      method: req.method,
      url: req.url
    });
    
    return res.status(400).json({
      status: 'error',
      message: 'Missing required headers',
      details: { missingHeaders }
    });
  }
  
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    const validContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];
    
    if (!validContentTypes.some(type => contentType?.includes(type))) {
      logger.warn('Invalid content type', {
        requestId: req.requestId,
        contentType,
        method: req.method,
        url: req.url
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid content type'
      });
    }
  }
  
  next();
};

// API versioning middleware
const apiVersioning = (req, res, next) => {
  const version = req.headers['api-version'] || req.query.version || 'v1';
  
  // Validate version
  const supportedVersions = ['v1'];
  if (!supportedVersions.includes(version)) {
    return res.status(400).json({
      status: 'error',
      message: 'Unsupported API version',
      supportedVersions
    });
  }
  
  req.apiVersion = version;
  res.setHeader('API-Version', version);
  
  next();
};

// Compose all tracking middleware
const trackingMiddleware = [
  requestIdMiddleware,
  corsMiddleware,
  responseSecurityHeaders,
  validateRequest,
  apiVersioning,
  requestLoggerMiddleware
];

module.exports = {
  trackingMiddleware,
  requestIdMiddleware,
  requestLoggerMiddleware,
  corsMiddleware,
  responseSecurityHeaders,
  validateRequest,
  apiVersioning
};
