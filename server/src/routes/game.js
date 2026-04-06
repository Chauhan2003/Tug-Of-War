const express = require('express');
const { getDb } = require('../db/mongodb');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler } = require('../utils/errorHandler');
const aiQuestionGenerator = require('../services/aiQuestionGenerator');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/game/classes
router.get('/classes', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();
  const classes = await db.collection('classes').find({}).sort({ id: 1 }).toArray();
  const user = await db.collection('users').findOne(
    { id: req.user.id },
    { projection: { level: 1 } }
  );

  const result = classes.map((c) => ({
    ...c,
    unlocked: user.level >= c.unlock_level,
  }));

  res.json(result);
}));

// GET /api/game/classes/:classId/levels
router.get('/classes/:classId/levels', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();
  const classId = parseInt(req.params.classId);

  const levels = await db.collection('levels')
    .find({ class_id: classId })
    .sort({ level_number: 1 })
    .toArray();

  const progress = await db.collection('user_progress')
    .find({
      user_id: req.user.id,
      class_id: classId
    })
    .project({ level_id: 1, stars: 1, best_score: 1, completed: 1 })
    .toArray();

  const progressMap = {};
  for (const p of progress) {
    progressMap[p.level_id] = p;
  }

  let totalStars = 0;
  const result = levels.map((level) => {
    const p = progressMap[level._id];
    if (p) totalStars += p.stars;
    return {
      ...level,
      id: level._id,
      stars: p ? p.stars : 0,
      best_score: p ? p.best_score : 0,
      completed: p ? p.completed : 0,
      unlocked: totalStars >= level.stars_required || level.level_number === 1,
    };
  });

  res.json(result);
}));

// POST /api/game/question (legacy - kept for compatibility)
router.post('/question', authenticateToken, validate(schemas.getQuestion), asyncHandler(async (req, res) => {
  const { classId, levelId } = req.body;
  const db = await getDb();

  let operations = '+-';
  let minNum = 1;
  let maxNum = 20;

  if (levelId) {
    const level = await db.collection('levels').findOne({ _id: levelId });
    if (level) {
      operations = level.operations;
      minNum = level.min_number;
      maxNum = level.max_number;
    }
  } else if (classId) {
    const cls = await db.collection('classes').findOne({ id: classId });
    if (cls) {
      const level = await db.collection('levels')
        .find({ class_id: classId })
        .sort({ level_number: 1 })
        .limit(1)
        .next();
      if (level) {
        operations = level.operations;
        minNum = level.min_number;
        maxNum = level.max_number;
      }
    }
  }

  const question = generateQuestion(operations, minNum, maxNum);
  res.json(question);
}));

// POST /api/game/questions (new AI-powered endpoint)
router.post('/questions', authenticateToken, validate(schemas.getQuestion), asyncHandler(async (req, res) => {
  const { classId, levelId } = req.body;
  
  if (!classId || !levelId) {
    return res.status(400).json({
      status: 'error',
      message: 'Both classId and levelId are required for AI question generation'
    });
  }

  try {
    const questions = await aiQuestionGenerator.generateQuestions(classId, levelId, req.user.id);
    
    logger.info('AI questions generated successfully', {
      userId: req.user.id,
      classId,
      levelId,
      questionCount: questions.questions.length
    });
    
    res.json({
      status: 'success',
      data: questions,
      metadata: {
        generated: new Date().toISOString(),
        userId: req.user.id,
        aiGenerated: !questions.metadata?.fallback
      }
    });
  } catch (error) {
    logger.error('AI question generation failed', error, {
      userId: req.user.id,
      classId,
      levelId
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate questions. Please try again.',
      fallback: error.fallback || false
    });
  }
}));

// GET /api/game/ai-status
router.get('/ai-status', authenticateToken, asyncHandler(async (req, res) => {
  const status = await aiQuestionGenerator.getStatus();
  res.json({
    status: 'success',
    data: status
  });
}));

// DELETE /api/game/cache/:classId/:levelId
router.delete('/cache/:classId/:levelId', authenticateToken, asyncHandler(async (req, res) => {
  const { classId, levelId } = req.params;
  
  await aiQuestionGenerator.clearCache(classId, levelId);
  
  res.json({
    status: 'success',
    message: 'Cache cleared successfully'
  });
}));

// POST /api/game/result
router.post('/result', authenticateToken, asyncHandler(async (req, res) => {
  const {
    mode,
    classId,
    levelId,
    playerScore,
    opponentScore,
    totalQuestions,
    streak,
    accuracy,
    duration,
    won,
  } = req.body;

  const db = await getDb();
  const userId = req.user.id;

  // Calculate points
  const basePoints = playerScore * 10;
  const streakBonus = streak * 5;
  const winBonus = won ? 50 : 0;
  const totalPoints = basePoints + streakBonus + winBonus;

  // Get current user stats
  const currentUser = await db.collection('users').findOne(
    { id: userId },
    { projection: { total_points: 1, matches_played: 1, accuracy: 1, best_streak: 1, level: 1 } }
  );

  // Calculate new accuracy
  const newMatchesPlayed = currentUser.matches_played + 1;
  const newAccuracy = Math.round(
    ((currentUser.accuracy * currentUser.matches_played) + (accuracy || 0)) / newMatchesPlayed * 10
  ) / 10;

  // Calculate new level
  const newTotalPoints = currentUser.total_points + totalPoints;
  const newLevel = Math.max(currentUser.level, Math.floor(newTotalPoints / 500) + 1);

  // Update user stats
  await db.collection('users').updateOne(
    { id: userId },
    {
      $set: {
        total_points: newTotalPoints,
        matches_played: newMatchesPlayed,
        wins: currentUser.wins + (won ? 1 : 0),
        losses: currentUser.losses + (won ? 0 : 1),
        accuracy: newAccuracy,
        best_streak: Math.max(currentUser.best_streak, streak),
        level: newLevel
      }
    }
  );

  // Record match
  await db.collection('match_history').insertOne({
    player1_id: userId,
    player1_score: playerScore,
    player2_score: opponentScore,
    winner_id: won ? userId : null,
    mode: mode || 'single',
    class_id: classId || null,
    level_id: levelId || null,
    duration: duration || null,
    created_at: new Date().toISOString()
  });

  // Update level progress
  if (levelId && won) {
    const stars = playerScore >= totalQuestions ? 3 : playerScore >= totalQuestions * 0.7 ? 2 : 1;
    const existing = await db.collection('user_progress').findOne({
      user_id: userId,
      level_id: levelId
    });

    if (existing) {
      await db.collection('user_progress').updateOne(
        { user_id: userId, level_id: levelId },
        {
          $set: {
            stars: Math.max(existing.stars, stars),
            best_score: Math.max(existing.best_score, playerScore),
            completed: 1
          }
        }
      );
    } else {
      await db.collection('user_progress').insertOne({
        user_id: userId,
        class_id: classId,
        level_id: levelId,
        stars,
        best_score: playerScore,
        completed: 1
      });
    }
  }

  const updatedUser = await db.collection('users').findOne(
    { id: userId },
    {
      projection: {
        total_points: 1,
        matches_played: 1,
        wins: 1,
        losses: 1,
        level: 1,
        best_streak: 1
      }
    }
  );

  res.json({
    pointsEarned: totalPoints,
    breakdown: { basePoints, streakBonus, winBonus },
    updatedStats: updatedUser,
  });
}));

function generateQuestion(operations, minNum, maxNum) {
  const ops = operations.split('');
  const op = ops[Math.floor(Math.random() * ops.length)];
  let num1, num2, answer;

  switch (op) {
    case '+':
      num1 = randInt(minNum, maxNum);
      num2 = randInt(minNum, maxNum);
      answer = num1 + num2;
      break;
    case '-':
      num1 = randInt(minNum, maxNum);
      num2 = randInt(minNum, num1); // ensure non-negative for kids
      answer = num1 - num2;
      break;
    case '*':
      num1 = randInt(minNum, Math.min(maxNum, 12));
      num2 = randInt(minNum, Math.min(maxNum, 12));
      answer = num1 * num2;
      break;
    case '/':
      num2 = randInt(Math.max(minNum, 1), Math.min(maxNum, 12));
      answer = randInt(1, Math.min(maxNum, 10));
      num1 = num2 * answer; // ensure clean division
      break;
    default:
      num1 = randInt(minNum, maxNum);
      num2 = randInt(minNum, maxNum);
      answer = num1 + num2;
  }

  return { num1, num2, operation: op, answer };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;
