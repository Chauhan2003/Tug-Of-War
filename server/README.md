# Tug of War - Production-Ready Backend Server

Enterprise-grade Node.js backend for the Math Tug of War game with scalability, security, and monitoring capabilities.

## 🚀 Tech Stack

- **Express.js** — REST API framework
- **Socket.IO** — Real-time multiplayer gaming
- **MongoDB** — Scalable NoSQL database
- **Redis** — High-performance caching
- **JWT** — Secure authentication
- **bcryptjs** — Password hashing
- **Winston/Pino** — Structured logging
- **Joi** — Input validation
- **Helmet** — Security headers
- **Rate Limiting** — DDoS protection

## 📋 Features

### 🔒 Security
- JWT-based authentication with secure token management
- Rate limiting (configurable per endpoint)
- Input validation and sanitization
- Security headers (CSP, HSTS, XSS protection)
- IP blocking capabilities
- Request ID tracking for audit trails

### 📊 Monitoring & Logging
- Structured logging with Winston and Pino
- Performance metrics and health checks
- Prometheus-compatible metrics endpoint
- Database performance monitoring
- Real-time error tracking

### 🚀 Performance & Scalability
- MongoDB connection pooling (50 max connections)
- Redis caching layer
- Optimized database indexes
- Async/await throughout
- Graceful shutdown handling
- Memory-efficient operations

### 🛠️ Development & Deployment
- Docker containerization
- Docker Compose for local development
- Environment-specific configurations
- Comprehensive health checks
- Production-ready error handling

## 🏗️ Architecture

```
src/
├── db/
│   └── mongodb.js           # MongoDB connection & setup
├── game/
│   ├── roomManager.js       # Multiplayer room logic
│   └── socketHandler.js     # Socket.IO event handling
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── requestTracking.js   # Request ID & CORS
│   └── security.js          # Rate limiting & security
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── game.js              # Game logic endpoints
│   ├── health.js            # Health checks & metrics
│   ├── leaderboard.js       # Leaderboard endpoints
│   └── profile.js           # User profile endpoints
├── utils/
│   ├── cache.js             # Redis caching wrapper
│   ├── errorHandler.js      # Centralized error handling
│   ├── logger.js            # Logging configuration
│   └── validation.js        # Input validation schemas
└── index.js                 # Main server entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- Redis 6.0+ (optional, for caching)

### Local Development

```bash
# Clone and navigate to server
cd server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start MongoDB and Redis (using Docker)
docker-compose up -d mongodb redis

# Start development server
npm run dev
```

Server runs on `http://localhost:3001` by default.

### Docker Deployment

```bash
# Start all services (app, MongoDB, Redis)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build and start production services
docker-compose --profile production up -d

# Include monitoring stack
docker-compose --profile production --profile monitoring up -d
```

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/tug_of_war
DB_NAME=tug_of_war

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
CLIENT_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_TTL=300               # 5 minutes
CACHE_ENABLED=true

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
```

## 📊 Monitoring

### Health Checks
- **Basic**: `/api/health` - Simple health status
- **Detailed**: `/api/health/detailed` - Full system metrics
- **Ready**: `/api/ready` - Kubernetes readiness probe
- **Live**: `/api/live` - Kubernetes liveness probe

### Metrics
- **Prometheus**: `/api/metrics` - Prometheus-compatible metrics
- **Performance**: `/api/performance` - Performance benchmarks

### Logging
Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)
- `logs/exceptions.log` (uncaught exceptions)

## 🔒 Security Features

### Authentication
- JWT tokens with configurable expiration
- Secure password hashing with bcrypt
- Guest account support

### Rate Limiting
- Global: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Game endpoints: 30 requests per minute
- Room creation: 3 requests per minute

### Input Validation
- Joi schemas for all endpoints
- XSS protection
- SQL injection prevention
- File size limits

### Security Headers
- Content Security Policy
- HSTS (HTTPS only)
- XSS Protection
- Frame protection
- Referrer policy

## 📈 Performance

### Database Optimization
- Connection pooling (50 max, 5 min)
- Optimized indexes for all collections
- Query performance monitoring
- Read/write concerns for data safety

### Caching Strategy
- Redis for frequently accessed data
- User profiles and leaderboards
- Game classes and levels
- Configurable TTL per data type

### Memory Management
- Efficient garbage collection
- Connection reuse
- Streaming for large datasets
- Memory usage monitoring

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/guest` - Guest account creation

### Profile Management
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile

### Game Features
- `GET /api/game/classes` - Get game classes
- `GET /api/game/classes/:id/levels` - Get class levels
- `POST /api/game/question` - Generate question
- `POST /api/game/result` - Submit game result

### Leaderboard
- `GET /api/leaderboard` - Get top players

### Health & Monitoring
- `GET /api/health` - Health check
- `GET /api/health/detailed` - Detailed metrics
- `GET /api/metrics` - Prometheus metrics
- `GET /api/performance` - Performance stats

## 🎮 Socket.IO Events

### Client → Server
- `create-room` - Create multiplayer room
- `join-room` - Join existing room
- `submit-answer` - Submit game answer
- `leave-room` - Leave room

### Server → Client
- `player-joined` - Player joined notification
- `match-ready` - Match starting countdown
- `game-start` - Game begins
- `game-update` - Score updates
- `next-question` - New question
- `game-over` - Game finished
- `player-left` - Player disconnected

## 🛠️ Development

### Scripts
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # Run tests
npm run lint       # Code linting
npm run build      # Build for production
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 📦 Deployment

### Docker
```bash
# Build image
docker build -t tug-of-war-server .

# Run container
docker run -p 3001:3001 tug-of-war-server
```

### Docker Compose
```bash
# Development environment
docker-compose up -d

# Production with monitoring
docker-compose --profile production --profile monitoring up -d
```

### Environment Setup
- **Development**: Debug logging, no cache, relaxed security
- **Test**: In-memory databases, minimal logging
- **Staging**: Production-like with debug features
- **Production**: Optimized for performance and security

## 🔧 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MongoDB status
docker-compose logs mongodb

# Verify connection string
echo $MONGODB_URI
```

**Redis Connection Failed**
```bash
# Check Redis status
docker-compose logs redis

# Test connection
redis-cli ping
```

**High Memory Usage**
```bash
# Check memory metrics
curl http://localhost:3001/api/health/detailed

# Monitor connections
curl http://localhost:3001/api/metrics
```

### Performance Tuning

**Database Performance**
- Monitor slow queries
- Check index usage
- Optimize connection pool size

**Cache Performance**
- Monitor Redis hit rate
- Adjust TTL values
- Scale Redis if needed

**Application Performance**
- Monitor response times
- Check error rates
- Scale horizontally if needed

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests
5. Submit pull request

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check health endpoints
- Review logs for errors
