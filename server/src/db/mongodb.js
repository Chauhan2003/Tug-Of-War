const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');
const { cache } = require('../utils/cache');

let db;
let client;

async function getDb() {
  if (db) return db;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'tug_of_war';

  try {
    // Connection options for production
    const options = {
      maxPoolSize: 50, // Maximum connection pool size
      minPoolSize: 5,  // Minimum connection pool size
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a send or receive on a socket can take
      connectTimeoutMS: 10000, // How long to wait for initial connection
      heartbeatFrequencyMS: 10000, // How often to check server status
      retryWrites: true,
      retryReads: true,
      readPreference: 'primary',
      writeConcern: { w: 'majority', j: true }
    };

    client = new MongoClient(mongoUri, options);
    await client.connect();
    db = client.db(dbName);
    
    logger.info('Connected to MongoDB', {
      host: mongoUri,
      database: dbName,
      poolSize: client.topology?.s?.server?.pool?.totalConnectionCount || 0
    });
    
    await initCollections(db);
    await seedData(db);
    
    return db;
  } catch (error) {
    logger.error('MongoDB connection error', error);
    throw error;
  }
}

async function initCollections(db) {
  try {
    logger.info('Initializing MongoDB collections and indexes');
    
    // Create indexes for better performance
    const indexes = [
      // Users collection
      { collection: 'users', index: { id: 1 }, options: { unique: true } },
      { collection: 'users', index: { username: 1 }, options: { unique: true } },
      { collection: 'users', index: { email: 1 }, options: { unique: true, sparse: true } },
      { collection: 'users', index: { total_points: -1 } },
      { collection: 'users', index: { created_at: -1 } },
      
      // Classes collection
      { collection: 'classes', index: { id: 1 }, options: { unique: true } },
      
      // Levels collection
      { collection: 'levels', index: { class_id: 1, level_number: 1 }, options: { unique: true } },
      { collection: 'levels', index: { class_id: 1 } },
      
      // User progress collection
      { collection: 'user_progress', index: { user_id: 1, level_id: 1 }, options: { unique: true } },
      { collection: 'user_progress', index: { user_id: 1 } },
      { collection: 'user_progress', index: { class_id: 1 } },
      
      // Match history collection
      { collection: 'match_history', index: { created_at: -1 } },
      { collection: 'match_history', index: { player1_id: 1 } },
      { collection: 'match_history', index: { player2_id: 1 } },
      { collection: 'match_history', index: { room_code: 1 } },
      { collection: 'match_history', index: { winner_id: 1 } }
    ];

    for (const { collection, index, options } of indexes) {
      try {
        await db.collection(collection).createIndex(index, options);
        logger.debug('Created index', { collection, index, options });
      } catch (error) {
        if (error.code !== 85) { // Ignore "IndexKeySpecsConflict" error
          logger.warn('Failed to create index', { collection, index, error: error.message });
        }
      }
    }

    logger.info('MongoDB indexes initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize MongoDB collections', error);
    throw error;
  }
}

async function seedData(db) {
  try {
    const classesCount = await db.collection('classes').countDocuments();
    if (classesCount > 0) {
      logger.debug('Database already seeded, skipping');
      return;
    }

    logger.info('Seeding database with initial data');

    const classes = [
      {
        id: 1,
        name: 'Class 1',
        emoji: '🌱',
        color: 'from-green-400 to-emerald-500',
        description: 'Addition Basics',
        unlock_level: 1
      },
      {
        id: 2,
        name: 'Class 2',
        emoji: '🌿',
        color: 'from-blue-400 to-cyan-500',
        description: 'Subtraction Fun',
        unlock_level: 1
      },
      {
        id: 3,
        name: 'Class 3',
        emoji: '🌳',
        color: 'from-purple-400 to-violet-500',
        description: 'Multiplication',
        unlock_level: 3
      },
      {
        id: 4,
        name: 'Class 4',
        emoji: '🎯',
        color: 'from-orange-400 to-red-500',
        description: 'Division World',
        unlock_level: 5
      },
      {
        id: 5,
        name: 'Class 5',
        emoji: '🏆',
        color: 'from-yellow-400 to-amber-500',
        description: 'Mixed Challenge',
        unlock_level: 7
      }
    ];

    await db.collection('classes').insertMany(classes);
    logger.info('Inserted classes', { count: classes.length });

    // Insert levels for each class
    const levels = [];
    
    // Class 1: Addition
    for (let i = 1; i <= 5; i++) {
      levels.push({
        class_id: 1,
        level_number: i,
        name: `Level ${i}`,
        operations: '+',
        min_number: 1,
        max_number: 10 + i * 5,
        questions_count: 10,
        time_limit: 60,
        stars_required: (i - 1) * 2
      });
    }
    
    // Class 2: Subtraction
    for (let i = 1; i <= 5; i++) {
      levels.push({
        class_id: 2,
        level_number: i,
        name: `Level ${i}`,
        operations: '-',
        min_number: 1,
        max_number: 10 + i * 5,
        questions_count: 10,
        time_limit: 60,
        stars_required: (i - 1) * 2
      });
    }
    
    // Class 3: Multiplication
    for (let i = 1; i <= 5; i++) {
      levels.push({
        class_id: 3,
        level_number: i,
        name: `Level ${i}`,
        operations: '*',
        min_number: 1,
        max_number: 5 + i * 2,
        questions_count: 10,
        time_limit: 90,
        stars_required: (i - 1) * 2
      });
    }
    
    // Class 4: Division
    for (let i = 1; i <= 5; i++) {
      levels.push({
        class_id: 4,
        level_number: i,
        name: `Level ${i}`,
        operations: '/',
        min_number: 1,
        max_number: 5 + i * 2,
        questions_count: 10,
        time_limit: 90,
        stars_required: (i - 1) * 2
      });
    }
    
    // Class 5: Mixed
    for (let i = 1; i <= 5; i++) {
      levels.push({
        class_id: 5,
        level_number: i,
        name: `Level ${i}`,
        operations: '+-*/',
        min_number: 1,
        max_number: 10 + i * 5,
        questions_count: 10,
        time_limit: 60,
        stars_required: (i - 1) * 2
      });
    }

    await db.collection('levels').insertMany(levels);
    logger.info('Inserted levels', { count: levels.length });
    
    // Cache the initial data
    if (cache.isAvailable()) {
      await cache.set('classes:all', classes, 3600);
      logger.info('Cached initial classes data');
    }
    
    logger.info('✅ Database seeded successfully');
  } catch (error) {
    logger.error('Failed to seed database', error);
    throw error;
  }
}

async function closeDb() {
  try {
    if (client) {
      await client.close();
      logger.info('MongoDB connection closed');
    }
    if (cache.isAvailable()) {
      await cache.disconnect();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections', error);
  }
}

// Database health check
async function healthCheck() {
  const health = {
    mongodb: { status: 'disconnected', responseTime: 0 },
    redis: { status: 'disconnected', responseTime: 0 },
    overall: 'unhealthy'
  };

  try {
    // Check MongoDB
    const start = Date.now();
    await db.collection('users').countDocuments();
    health.mongodb.responseTime = Date.now() - start;
    health.mongodb.status = 'connected';
  } catch (error) {
    logger.error('MongoDB health check failed', error);
  }

  try {
    // Check Redis
    if (cache.isAvailable()) {
      const start = Date.now();
      await cache.get('health:check');
      health.redis.responseTime = Date.now() - start;
      health.redis.status = 'connected';
    }
  } catch (error) {
    logger.error('Redis health check failed', error);
  }

  health.overall = health.mongodb.status === 'connected' ? 'healthy' : 'unhealthy';
  return health;
}

// Database statistics
async function getStats() {
  try {
    const stats = {
      users: await db.collection('users').countDocuments(),
      matches: await db.collection('match_history').countDocuments(),
      classes: await db.collection('classes').countDocuments(),
      levels: await db.collection('levels').countDocuments(),
      avgResponseTime: 0
    };

    // Get average response time (simplified)
    const start = Date.now();
    await db.collection('users').findOne();
    stats.avgResponseTime = Date.now() - start;

    return stats;
  } catch (error) {
    logger.error('Failed to get database stats', error);
    return null;
  }
}

module.exports = { 
  getDb, 
  closeDb, 
  healthCheck, 
  getStats,
  initCollections,
  seedData
};
