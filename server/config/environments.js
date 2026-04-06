const path = require('path');

// Base configuration
const baseConfig = {
  // Server configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/tug_of_war',
  DB_NAME: process.env.DB_NAME || 'tug_of_war',
  
  // Redis configuration
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: process.env.REDIS_DB || 0,
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  
  // CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // File uploads
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  
  // Cache
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
  CACHE_ENABLED: process.env.CACHE_ENABLED !== 'false',
  
  // Monitoring
  METRICS_ENABLED: process.env.METRICS_ENABLED !== 'false',
  HEALTH_CHECK_ENABLED: process.env.HEALTH_CHECK_ENABLED !== 'false'
};

// Environment-specific configurations
const environments = {
  development: {
    ...baseConfig,
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    METRICS_ENABLED: true,
    CACHE_ENABLED: false, // Disable cache in development for easier debugging
    CORS_ORIGINS: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080'
    ]
  },
  
  test: {
    ...baseConfig,
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    METRICS_ENABLED: false,
    CACHE_ENABLED: false,
    MONGODB_URI: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/tug_of_war_test',
    REDIS_DB: 1, // Use different Redis DB for tests
    CORS_ORIGINS: ['http://localhost:5173']
  },
  
  staging: {
    ...baseConfig,
    NODE_ENV: 'staging',
    LOG_LEVEL: 'info',
    METRICS_ENABLED: true,
    CACHE_ENABLED: true,
    CORS_ORIGINS: [
      'https://staging.math-tug-of-war.com',
      'https://math-tug-of-war-staging.netlify.app'
    ]
  },
  
  production: {
    ...baseConfig,
    NODE_ENV: 'production',
    LOG_LEVEL: 'warn',
    METRICS_ENABLED: true,
    CACHE_ENABLED: true,
    BCRYPT_ROUNDS: 12, // More secure in production
    RATE_LIMIT_MAX_REQUESTS: 50, // Stricter rate limiting
    CORS_ORIGINS: [
      'https://math-tug-of-war.com',
      'https://www.math-tug-of-war.com',
      'https://math-tug-of-war.netlify.app'
    ]
  }
};

// Get current environment configuration
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  const config = environments[env] || environments.development;
  
  // Validate required environment variables
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && env === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  return config;
}

// Configuration validation
function validateConfig(config) {
  const errors = [];
  
  // Validate port
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }
  
  // Validate MongoDB URI
  if (!config.MONGODB_URI || !config.MONGODB_URI.startsWith('mongodb://')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }
  
  // Validate JWT secret
  if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production');
  }
  
  // Validate Redis configuration
  if (config.CACHE_ENABLED) {
    if (isNaN(config.REDIS_PORT) || config.REDIS_PORT < 1 || config.REDIS_PORT > 65535) {
      errors.push('REDIS_PORT must be a valid port number (1-65535)');
    }
  }
  
  return errors;
}

// Get database configuration for MongoDB
function getDatabaseConfig() {
  const config = getConfig();
  
  return {
    uri: config.MONGODB_URI,
    dbName: config.DB_NAME,
    options: {
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      readPreference: 'primary',
      writeConcern: { w: 'majority', j: true }
    }
  };
}

// Get Redis configuration
function getRedisConfig() {
  const config = getConfig();
  
  return {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  };
}

// Get CORS configuration
function getCorsConfig() {
  const config = getConfig();
  
  return {
    origin: config.CORS_ORIGINS || [config.CLIENT_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset']
  };
}

// Get rate limiting configuration
function getRateLimitConfig() {
  const config = getConfig();
  
  return {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
  };
}

module.exports = {
  getConfig,
  validateConfig,
  getDatabaseConfig,
  getRedisConfig,
  getCorsConfig,
  getRateLimitConfig,
  environments
};
