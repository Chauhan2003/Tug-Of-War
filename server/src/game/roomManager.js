const { generateQuestion } = require('./questionGenerator');

// In-memory store for active game rooms
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(hostPlayer, options = {}) {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room = {
    code,
    host: hostPlayer.id,
    players: [hostPlayer],
    status: 'waiting', // waiting | ready | playing | finished
    options: {
      totalQuestions: options.totalQuestions || 10,
      timeLimit: options.timeLimit || 60,
      operations: options.operations || '+-',
      minNum: options.minNum || 1,
      maxNum: options.maxNum || 20,
    },
    gameState: null,
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

function joinRoom(code, player) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'waiting') return { error: 'Game already in progress' };
  if (room.players.length >= 2) return { error: 'Room is full' };
  if (room.players.find((p) => p.id === player.id)) return { error: 'Already in room' };

  room.players.push(player);
  room.status = 'ready';
  return { room };
}

function startGame(code) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.players.length < 2) return null;

  const questions = [];
  for (let i = 0; i < room.options.totalQuestions; i++) {
    questions.push(generateQuestion(room.options.operations, room.options.minNum, room.options.maxNum));
  }

  room.status = 'playing';
  room.gameState = {
    questions,
    currentQuestion: 0,
    scores: {
      [room.players[0].id]: 0,
      [room.players[1].id]: 0,
    },
    ropePosition: 50, // 10 = player1 wins, 90 = player2 wins
    streaks: {
      [room.players[0].id]: 0,
      [room.players[1].id]: 0,
    },
    // Track who answered the CURRENT shared question
    currentAnswers: {},
    startTime: Date.now(),
    timeLeft: room.options.timeLimit,
  };

  return room;
}

function submitAnswer(code, playerId, answer) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return null;

  const gs = room.gameState;
  const question = gs.questions[gs.currentQuestion];
  if (!question) return null;

  // Prevent answering same question twice
  if (gs.currentAnswers[playerId]) return null;

  const correct = answer === question.answer;
  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return null;

  // Record this player's answer for the current question
  gs.currentAnswers[playerId] = { answer, correct };

  if (correct) {
    gs.scores[playerId]++;
    gs.streaks[playerId]++;
    // Move rope: player 0 pulls left (decrease), player 1 pulls right (increase)
    const ropeDelta = playerIndex === 0 ? -6 : 6;
    gs.ropePosition = Math.max(10, Math.min(90, gs.ropePosition + ropeDelta));
  } else {
    gs.streaks[playerId] = 0;
    // Wrong answer: rope moves opposite direction
    const ropeDelta = playerIndex === 0 ? 4 : -4;
    gs.ropePosition = Math.max(10, Math.min(90, gs.ropePosition + ropeDelta));
  }

  // Check if both players answered this question
  const bothAnswered = room.players.every((p) => gs.currentAnswers[p.id]);

  // Check game over by rope position
  let gameOver = false;
  let winner = null;
  if (gs.ropePosition <= 15) {
    gameOver = true;
    winner = room.players[0].id;
  } else if (gs.ropePosition >= 85) {
    gameOver = true;
    winner = room.players[1].id;
  }

  // If both answered, advance to next question
  let advanceQuestion = false;
  if (bothAnswered && !gameOver) {
    gs.currentQuestion++;
    gs.currentAnswers = {};
    advanceQuestion = true;

    // All questions done
    if (gs.currentQuestion >= gs.questions.length) {
      gameOver = true;
      if (gs.scores[room.players[0].id] > gs.scores[room.players[1].id]) {
        winner = room.players[0].id;
      } else if (gs.scores[room.players[1].id] > gs.scores[room.players[0].id]) {
        winner = room.players[1].id;
      }
    }
  }

  if (gameOver) {
    room.status = 'finished';
    gs.winner = winner;
    gs.endTime = Date.now();
  }

  return {
    correct,
    scores: gs.scores,
    ropePosition: gs.ropePosition,
    streaks: gs.streaks,
    gameOver,
    winner,
    currentQuestion: gs.currentQuestion,
    bothAnswered,
    advanceQuestion,
  };
}

// Force advance to next question (called on per-question timeout)
function forceAdvanceQuestion(code) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return null;

  const gs = room.gameState;

  // Penalize players who didn't answer
  for (const p of room.players) {
    if (!gs.currentAnswers[p.id]) {
      gs.streaks[p.id] = 0;
    }
  }

  gs.currentQuestion++;
  gs.currentAnswers = {};

  let gameOver = false;
  let winner = null;

  if (gs.currentQuestion >= gs.questions.length) {
    gameOver = true;
    if (gs.scores[room.players[0].id] > gs.scores[room.players[1].id]) {
      winner = room.players[0].id;
    } else if (gs.scores[room.players[1].id] > gs.scores[room.players[0].id]) {
      winner = room.players[1].id;
    }
    room.status = 'finished';
    gs.winner = winner;
    gs.endTime = Date.now();
  }

  return {
    currentQuestion: gs.currentQuestion,
    scores: gs.scores,
    ropePosition: gs.ropePosition,
    gameOver,
    winner,
  };
}

function getCurrentQuestion(code) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return null;

  const gs = room.gameState;
  if (gs.currentQuestion >= gs.questions.length) return null;

  const q = gs.questions[gs.currentQuestion];
  return {
    index: gs.currentQuestion,
    num1: q.num1,
    num2: q.num2,
    operation: q.operation,
    total: gs.questions.length,
  };
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function removePlayer(code, playerId) {
  const room = rooms.get(code);
  if (!room) return;

  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.players.length === 0) {
    rooms.delete(code);
  } else if (room.status === 'playing') {
    room.status = 'finished';
    if (room.gameState) {
      room.gameState.winner = room.players[0]?.id || null;
    }
  }
}

function deleteRoom(code) {
  rooms.delete(code);
}

function getActiveRoomCount() {
  return rooms.size;
}

function getPlayerCount() {
  let count = 0;
  for (const room of rooms.values()) {
    count += room.players.length;
  }
  return count;
}

// Cleanup stale rooms (older than 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > 30 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  submitAnswer,
  forceAdvanceQuestion,
  getCurrentQuestion,
  getRoom,
  removePlayer,
  deleteRoom,
  getActiveRoomCount,
  getPlayerCount,
};
