require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { getDb } = require('./db/setup');
const { setupSocket } = require('./game/socketHandler');

// Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const leaderboardRoutes = require('./routes/leaderboard');
const gameRoutes = require('./routes/game');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'https://math-tug-of-war.netlify.app'],
  credentials: true,
}));
app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'https://math-tug-of-war.netlify.app'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize database
getDb();
console.log('✅ Database initialized');

// Setup socket handlers
setupSocket(io);

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/game', gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const matches = db.prepare('SELECT COUNT(*) as count FROM match_history').get();

    res.json({
      totalUsers: users.count,
      totalMatches: matches.count,
      connectedPlayers: io.sockets.sockets.size,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`
  🎮 ================================
  🎮  Tug of War Game Server
  🎮  Running on port ${PORT}
  🎮  API: http://localhost:${PORT}/api
  🎮  WebSocket: ws://localhost:${PORT}
  🎮 ================================
  `);
});
