const jwt = require('jsonwebtoken');
const roomManager = require('./roomManager');
const { getDb } = require('../db/setup');

function setupSocket(io) {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.user.username} (${socket.id})`);

    // --- CREATE ROOM ---
    socket.on('create-room', (options, callback) => {
      const player = {
        id: socket.user.id,
        username: socket.user.username,
        socketId: socket.id,
      };

      const room = roomManager.createRoom(player, options);
      socket.join(room.code);
      socket.roomCode = room.code;

      callback({
        success: true,
        roomCode: room.code,
        room: sanitizeRoom(room),
      });

      console.log(`🏠 Room created: ${room.code} by ${socket.user.username}`);
    });

    // --- JOIN ROOM ---
    socket.on('join-room', (code, callback) => {
      const player = {
        id: socket.user.id,
        username: socket.user.username,
        socketId: socket.id,
      };

      const result = roomManager.joinRoom(code.toUpperCase(), player);

      if (result.error) {
        return callback({ success: false, error: result.error });
      }

      socket.join(code);
      socket.roomCode = code;

      // Notify host that opponent joined
      io.to(code).emit('player-joined', {
        players: result.room.players.map((p) => ({
          id: p.id,
          username: p.username,
        })),
        status: result.room.status,
      });

      callback({
        success: true,
        room: sanitizeRoom(result.room),
      });

      console.log(`👋 ${socket.user.username} joined room ${code}`);

      // Auto-start countdown when 2 players are in
      if (result.room.players.length === 2) {
        io.to(code).emit('match-ready', {
          players: result.room.players.map((p) => ({
            id: p.id,
            username: p.username,
          })),
          countdown: 5,
        });

        // Start game after countdown
        setTimeout(() => {
          const room = roomManager.getRoom(code);
          if (room && room.status === 'ready') {
            const started = roomManager.startGame(code);
            if (started) {
              // Send the SAME first question to BOTH players
              const q = roomManager.getCurrentQuestion(code);
              for (const p of started.players) {
                const playerSocket = getSocketByUserId(io, p.id);
                if (playerSocket) {
                  playerSocket.emit('game-start', {
                    question: q,
                    timeLimit: started.options.timeLimit,
                    totalQuestions: started.options.totalQuestions,
                    opponent: started.players.find((op) => op.id !== p.id),
                    myIndex: started.players.indexOf(p),
                  });
                }
              }
              startGameTimer(io, code);
              startQuestionTimer(io, code);
            }
          }
        }, 5000);
      }
    });

    // --- SUBMIT ANSWER ---
    socket.on('submit-answer', (data, callback) => {
      const { roomCode, answer } = data;
      const code = roomCode || socket.roomCode;
      if (!code) return callback({ success: false, error: 'Not in a room' });

      const result = roomManager.submitAnswer(code, socket.user.id, answer);
      if (!result) return callback({ success: false, error: 'Invalid submission' });

      // Send result to the answering player
      callback({
        success: true,
        correct: result.correct,
        scores: result.scores,
        ropePosition: result.ropePosition,
      });

      // Broadcast updated game state to the room
      io.to(code).emit('game-update', {
        scores: result.scores,
        ropePosition: result.ropePosition,
        streaks: result.streaks,
        lastAction: {
          playerId: socket.user.id,
          correct: result.correct,
        },
      });

      if (result.gameOver) {
        endGame(io, code, result.winner);
      } else if (result.advanceQuestion) {
        // Both players answered — send the SAME next question to both
        const nextQ = roomManager.getCurrentQuestion(code);
        if (nextQ) {
          io.to(code).emit('next-question', { question: nextQ });
          resetQuestionTimer(io, code);
        }
      }
    });

    // --- LEAVE ROOM ---
    socket.on('leave-room', () => {
      handleLeave(io, socket);
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.user.username}`);
      handleLeave(io, socket);
    });

    // --- GET ACTIVE PLAYERS ---
    socket.on('get-active-players', (callback) => {
      callback({
        rooms: roomManager.getActiveRoomCount(),
        players: roomManager.getPlayerCount(),
      });
    });
  });
}

function handleLeave(io, socket) {
  const code = socket.roomCode;
  if (!code) return;

  const room = roomManager.getRoom(code);
  if (room) {
    roomManager.removePlayer(code, socket.user.id);
    socket.leave(code);
    socket.roomCode = null;

    // Notify remaining players
    io.to(code).emit('player-left', {
      playerId: socket.user.id,
      username: socket.user.username,
    });

    // If game was in progress, the remaining player wins
    if (room.status === 'playing' || room.status === 'finished') {
      const remaining = room.players[0];
      if (remaining) {
        io.to(code).emit('game-over', {
          winner: remaining.id,
          reason: 'opponent_disconnected',
          scores: room.gameState?.scores || {},
          ropePosition: room.gameState?.ropePosition || 50,
        });
      }
    }
  }
}

// Per-question timers — 10 seconds per question
const questionTimers = new Map();

function startQuestionTimer(io, code) {
  clearQuestionTimer(code);
  const timer = setTimeout(() => {
    const room = roomManager.getRoom(code);
    if (!room || room.status !== 'playing') return;

    // Force advance — penalize non-answerers
    const result = roomManager.forceAdvanceQuestion(code);
    if (!result) return;

    if (result.gameOver) {
      endGame(io, code, result.winner);
    } else {
      const nextQ = roomManager.getCurrentQuestion(code);
      if (nextQ) {
        io.to(code).emit('question-timeout', { scores: result.scores, ropePosition: result.ropePosition });
        setTimeout(() => {
          io.to(code).emit('next-question', { question: nextQ });
          resetQuestionTimer(io, code);
        }, 1000);
      }
    }
  }, 10000); // 10 seconds per question
  questionTimers.set(code, timer);
}

function resetQuestionTimer(io, code) {
  startQuestionTimer(io, code);
}

function clearQuestionTimer(code) {
  const existing = questionTimers.get(code);
  if (existing) {
    clearTimeout(existing);
    questionTimers.delete(code);
  }
}

function startGameTimer(io, code) {
  const interval = setInterval(() => {
    const room = roomManager.getRoom(code);
    if (!room || room.status !== 'playing') {
      clearInterval(interval);
      return;
    }

    room.gameState.timeLeft--;
    io.to(code).emit('timer-tick', { timeLeft: room.gameState.timeLeft });

    if (room.gameState.timeLeft <= 0) {
      clearInterval(interval);
      // Time's up — determine winner by score
      const gs = room.gameState;
      const p1 = room.players[0];
      const p2 = room.players[1];
      let winner = null;
      if (gs.scores[p1.id] > gs.scores[p2.id]) winner = p1.id;
      else if (gs.scores[p2.id] > gs.scores[p1.id]) winner = p2.id;

      endGame(io, code, winner);
    }
  }, 1000);
}

function endGame(io, code, winnerId) {
  const room = roomManager.getRoom(code);
  if (!room) return;

  clearQuestionTimer(code);
  room.status = 'finished';
  const gs = room.gameState;

  // Save match to database
  try {
    const db = getDb();
    const p1 = room.players[0];
    const p2 = room.players[1];

    db.prepare(`
      INSERT INTO match_history (room_code, player1_id, player2_id, player1_score, player2_score, winner_id, mode, duration)
      VALUES (?, ?, ?, ?, ?, ?, 'multiplayer', ?)
    `).run(
      code,
      p1?.id,
      p2?.id,
      gs.scores[p1?.id] || 0,
      gs.scores[p2?.id] || 0,
      winnerId,
      gs.endTime ? Math.round((gs.endTime - gs.startTime) / 1000) : room.options.timeLimit
    );

    // Update stats for both players
    for (const player of room.players) {
      const won = player.id === winnerId;
      const score = gs.scores[player.id] || 0;
      const streak = gs.streaks[player.id] || 0;
      const points = score * 10 + streak * 5 + (won ? 50 : 0);

      db.prepare(`
        UPDATE users SET
          total_points = total_points + ?,
          matches_played = matches_played + 1,
          wins = wins + ?,
          losses = losses + ?,
          best_streak = MAX(best_streak, ?)
        WHERE id = ?
      `).run(points, won ? 1 : 0, won ? 0 : 1, streak, player.id);
    }
  } catch (err) {
    console.error('Error saving match:', err);
  }

  io.to(code).emit('game-over', {
    winner: winnerId,
    scores: gs.scores,
    ropePosition: gs.ropePosition,
    streaks: gs.streaks,
    reason: 'game_complete',
  });

  // Cleanup room after 10 seconds
  setTimeout(() => roomManager.deleteRoom(code), 10000);
}

function getSocketByUserId(io, userId) {
  for (const [, socket] of io.sockets.sockets) {
    if (socket.user && socket.user.id === userId) {
      return socket;
    }
  }
  return null;
}

function sanitizeRoom(room) {
  return {
    code: room.code,
    host: room.host,
    players: room.players.map((p) => ({ id: p.id, username: p.username })),
    status: room.status,
    options: room.options,
  };
}

module.exports = { setupSocket };
