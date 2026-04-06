require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { getDb, closeDb, healthCheck } = require("./db/mongodb");
const { setupSocket } = require("./game/socketHandler");
const logger = require("./utils/logger");
const {
  setupProcessErrorHandlers,
  errorHandler,
  notFoundHandler,
} = require("./utils/errorHandler");
const { cache } = require("./utils/cache");
const {
  securityMiddleware,
  authLimiter,
  gameLimiter,
  createRoomLimiter,
} = require("./middleware/security");
const { trackingMiddleware } = require("./middleware/requestTracking");

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const leaderboardRoutes = require("./routes/leaderboard");
const gameRoutes = require("./routes/game");
const healthRoutes = require("./routes/health");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Core middleware
app.use(
  cors({
    origin: [
      CLIENT_URL,
      "http://localhost:5173",
      "https://math-tug-of-war.netlify.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply security and tracking middleware
app.use(...securityMiddleware);
app.use(...trackingMiddleware);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      CLIENT_URL,
      "http://localhost:5173",
      "https://math-tug-of-war.netlify.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize database and cache
Promise.all([getDb(), cache.connect()])
  .then(() => {
    logger.info("Database and cache initialized successfully");
  })
  .catch((error) => {
    logger.error("Failed to initialize database or cache", error);
    process.exit(1);
  });

// Setup socket handlers
setupSocket(io);

// REST API Routes with rate limiting
app.use("/api/health", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/game", gameLimiter, gameRoutes);
app.use("/api/game/create-room", createRoomLimiter, gameRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Setup process error handlers
setupProcessErrorHandlers();

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    // Close HTTP server
    server.close(() => {
      logger.info("HTTP server closed");
    });

    // Close database and cache connections
    await closeDb();

    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

server.listen(PORT, () => {
  logger.info("Server started successfully", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    pid: process.pid,
  });

  console.log(`
  🎮 ================================
  🎮  Tug of War Game Server
  🎮  Running on port ${PORT}
  🎮  API: http://localhost:${PORT}/api
  🎮  WebSocket: ws://localhost:${PORT}
  🎮  Environment: ${process.env.NODE_ENV || "development"}
  🎮 ================================
  `);
});
