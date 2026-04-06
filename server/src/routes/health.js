const express = require('express');
const { healthCheck, getStats } = require('../db/mongodb');
const { cache } = require('../utils/cache');
const logger = require('../utils/logger');
const { asyncHandler } = require('../utils/errorHandler');

const router = express.Router();

// Basic health check
router.get('/health', asyncHandler(async (req, res) => {
  const health = await healthCheck();
  
  const status = health.overall === 'healthy' ? 200 : 503;
  
  res.status(status).json({
    status: health.overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: health.mongodb,
    cache: health.redis,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  });
}));

// Detailed health check with metrics
router.get('/health/detailed', asyncHandler(async (req, res) => {
  const [health, dbStats] = await Promise.all([
    healthCheck(),
    getStats()
  ]);

  const metrics = {
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    database: {
      ...health.mongodb,
      stats: dbStats
    },
    cache: health.redis,
    server: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version
    }
  };

  const status = health.overall === 'healthy' ? 200 : 503;
  
  res.status(status).json({
    status: health.overall,
    metrics
  });
}));

// Readiness probe (for Kubernetes/container orchestration)
router.get('/ready', asyncHandler(async (req, res) => {
  const health = await healthCheck();
  
  if (health.overall === 'healthy') {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      issues: [
        ...(health.mongodb.status !== 'connected' ? ['Database unavailable'] : []),
        ...(health.redis.status !== 'connected' ? ['Cache unavailable'] : [])
      ]
    });
  }
}));

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', (req, res) => {
  // Basic liveness - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (for monitoring systems)
router.get('/metrics', asyncHandler(async (req, res) => {
  const dbStats = await getStats();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // Prometheus-style metrics
  const metrics = [
    `# HELP nodejs_memory_usage_bytes Memory usage in bytes`,
    `# TYPE nodejs_memory_usage_bytes gauge`,
    `nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
    `nodejs_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
    `nodejs_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
    `nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
    '',
    `# HELP nodejs_cpu_usage_total CPU usage in microseconds`,
    `# TYPE nodejs_cpu_usage_total counter`,
    `nodejs_cpu_usage_total{type="user"} ${cpuUsage.user}`,
    `nodejs_cpu_usage_total{type="system"} ${cpuUsage.system}`,
    '',
    `# HELP process_uptime_seconds Process uptime in seconds`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${process.uptime()}`,
    '',
    `# HELP database_connections_total Total database connections`,
    `# TYPE database_connections_total gauge`,
    `database_connections_total ${dbStats ? 1 : 0}`,
    '',
    `# HELP database_users_total Total number of users`,
    `# TYPE database_users_total gauge`,
    `database_users_total ${dbStats?.users || 0}`,
    '',
    `# HELP database_matches_total Total number of matches`,
    `# TYPE database_matches_total gauge`,
    `database_matches_total ${dbStats?.matches || 0}`,
    '',
    `# HELP cache_status Cache connection status (1=connected, 0=disconnected)`,
    `# TYPE cache_status gauge`,
    `cache_status ${cache.isAvailable() ? 1 : 0}`
  ];

  res.set('Content-Type', 'text/plain');
  res.send(metrics.join('\n'));
}));

// Performance metrics
router.get('/performance', asyncHandler(async (req, res) => {
  const start = Date.now();
  
  // Test database performance
  const dbStart = Date.now();
  const dbStats = await getStats();
  const dbTime = Date.now() - dbStart;
  
  // Test cache performance
  const cacheStart = Date.now();
  await cache.set('performance:test', { timestamp: Date.now() }, 10);
  const cacheResult = await cache.get('performance:test');
  const cacheTime = Date.now() - cacheStart;
  
  const totalTime = Date.now() - start;
  
  res.json({
    timestamp: new Date().toISOString(),
    responseTime: totalTime,
    database: {
      responseTime: dbTime,
      available: dbStats !== null,
      stats: dbStats
    },
    cache: {
      responseTime: cacheTime,
      available: cache.isAvailable(),
      testResult: cacheResult !== null
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
}));

module.exports = router;
