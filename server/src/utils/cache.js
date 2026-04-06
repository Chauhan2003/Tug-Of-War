const redis = require('redis');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.client = null;
    this.connected = false;
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };
  }

  async connect() {
    try {
      this.client = redis.createClient(this.config);
      
      this.client.on('error', (err) => {
        logger.error('Redis connection error', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
        this.connected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.connected = false;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      this.connected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  isAvailable() {
    return this.connected && this.client;
  }

  // Cache operations
  async get(key) {
    if (!this.isAvailable()) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', error, { key, ttl });
      return false;
    }
  }

  async del(key) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', error, { key });
      return false;
    }
  }

  async exists(key) {
    if (!this.isAvailable()) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', error, { key });
      return false;
    }
  }

  async flush() {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.flushDb();
      logger.info('Cache database flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', error);
      return false;
    }
  }

  // Hash operations for complex data
  async hget(key, field) {
    if (!this.isAvailable()) return null;
    
    try {
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache hget error', error, { key, field });
      return null;
    }
  }

  async hset(key, field, value, ttl = 3600) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.hSet(key, field, JSON.stringify(value));
      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }
      return true;
    } catch (error) {
      logger.error('Cache hset error', error, { key, field, ttl });
      return false;
    }
  }

  async hdel(key, field) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.hDel(key, field);
      return true;
    } catch (error) {
      logger.error('Cache hdel error', error, { key, field });
      return false;
    }
  }

  // List operations for queues
  async lpush(key, value) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache lpush error', error, { key });
      return false;
    }
  }

  async rpop(key) {
    if (!this.isAvailable()) return null;
    
    try {
      const value = await this.client.rPop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache rpop error', error, { key });
      return null;
    }
  }

  // Set operations for unique items
  async sadd(key, value) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.sAdd(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache sadd error', error, { key });
      return false;
    }
  }

  async srem(key, value) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.sRem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache srem error', error, { key });
      return false;
    }
  }

  async smembers(key) {
    if (!this.isAvailable()) return [];
    
    try {
      const members = await this.client.sMembers(key);
      return members.map(member => JSON.parse(member));
    } catch (error) {
      logger.error('Cache smembers error', error, { key });
      return [];
    }
  }
}

// Cache middleware factory
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    if (skipCache || !condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    
    try {
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey });
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl).catch(err => {
            logger.error('Failed to cache response', err, { key: cacheKey });
          });
        }
        return originalJson.call(this, data);
      };
      
      res.set('X-Cache', 'MISS');
      next();
    } catch (error) {
      logger.error('Cache middleware error', error, { key: cacheKey });
      next();
    }
  };
};

// Cache invalidation middleware
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      // Invalidate cache patterns after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(async (pattern) => {
          const key = typeof pattern === 'function' ? pattern(req) : pattern;
          await cache.del(key).catch(err => {
            logger.error('Failed to invalidate cache', err, { key });
          });
        });
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

// Create singleton instance
const cache = new CacheManager();

// Cache keys constants
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  LEADERBOARD: (params) => `leaderboard:${JSON.stringify(params)}`,
  CLASSES: 'classes:all',
  LEVELS: (classId) => `levels:class:${classId}`,
  GAME_ROOM: (roomCode) => `room:${roomCode}`,
  ACTIVE_PLAYERS: 'players:active',
  USER_STATS: (userId) => `user:stats:${userId}`,
  MATCH_HISTORY: (userId) => `matches:${userId}`
};

module.exports = {
  CacheManager,
  cache,
  cacheMiddleware,
  invalidateCache,
  CACHE_KEYS
};
