const winston = require('winston');
const pino = require('pino');
const pretty = require('pino-pretty');

// Environment-based logger configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Winston logger for structured logging
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: {
    service: 'tug-of-war-server',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Add console transport for development
if (!isProduction) {
  winstonLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Pino logger for high-performance logging
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => ({
      ...object,
      service: 'tug-of-war-server',
      environment: process.env.NODE_ENV || 'development'
    })
  }
}, pretty({
  colorize: !isProduction,
  translateTime: 'HH:MM:ss Z',
  ignore: 'pid,hostname'
}));

// Custom logger interface
const logger = {
  // Structured logging methods
  debug: (message, meta = {}) => {
    winstonLogger.debug(message, meta);
    pinoLogger.debug(meta, message);
  },
  
  info: (message, meta = {}) => {
    winstonLogger.info(message, meta);
    pinoLogger.info(meta, message);
  },
  
  warn: (message, meta = {}) => {
    winstonLogger.warn(message, meta);
    pinoLogger.warn(meta, message);
  },
  
  error: (message, error = null, meta = {}) => {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    winstonLogger.error(message, errorMeta);
    pinoLogger.error(errorMeta, message);
  },
  
  // Request logging
  logRequest: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.requestId,
      userId: req.user?.id
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  },
  
  // Socket logging
  logSocket: (event, socket, data = {}) => {
    logger.info('Socket Event', {
      event,
      socketId: socket.id,
      userId: socket.user?.id,
      username: socket.user?.username,
      ...data
    });
  },
  
  // Database logging
  logDatabase: (operation, collection, query = {}, result = {}) => {
    logger.debug('Database Operation', {
      operation,
      collection,
      query: JSON.stringify(query),
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      executionTime: result.executionTime
    });
  },
  
  // Performance logging
  logPerformance: (operation, duration, metadata = {}) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger[level]('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  },
  
  // Security logging
  logSecurity: (event, details = {}) => {
    logger.warn('Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
};

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;
