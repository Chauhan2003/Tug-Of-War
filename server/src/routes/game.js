const express = require('express');
const { getDb } = require('../db/setup');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/game/classes
router.get('/classes', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const classes = db.prepare('SELECT * FROM classes ORDER BY id').all();
    const user = db.prepare('SELECT level FROM users WHERE id = ?').get(req.user.id);

    const result = classes.map((c) => ({
      ...c,
      unlocked: user.level >= c.unlock_level,
    }));

    res.json(result);
  } catch (err) {
    console.error('Classes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/game/classes/:classId/levels
router.get('/classes/:classId/levels', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const classId = parseInt(req.params.classId);

    const levels = db.prepare(
      'SELECT * FROM levels WHERE class_id = ? ORDER BY level_number'
    ).all(classId);

    const progress = db.prepare(
      'SELECT level_id, stars, best_score, completed FROM user_progress WHERE user_id = ? AND class_id = ?'
    ).all(req.user.id, classId);

    const progressMap = {};
    for (const p of progress) {
      progressMap[p.level_id] = p;
    }

    let totalStars = 0;
    const result = levels.map((level) => {
      const p = progressMap[level.id];
      if (p) totalStars += p.stars;
      return {
        ...level,
        stars: p ? p.stars : 0,
        best_score: p ? p.best_score : 0,
        completed: p ? p.completed : 0,
        unlocked: totalStars >= level.stars_required || level.level_number === 1,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Levels error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/game/question
router.post('/question', authenticateToken, (req, res) => {
  try {
    const { classId, levelId } = req.body;
    const db = getDb();

    let operations = '+-';
    let minNum = 1;
    let maxNum = 20;

    if (levelId) {
      const level = db.prepare('SELECT * FROM levels WHERE id = ?').get(levelId);
      if (level) {
        operations = level.operations;
        minNum = level.min_number;
        maxNum = level.max_number;
      }
    } else if (classId) {
      const cls = db.prepare('SELECT id FROM classes WHERE id = ?').get(classId);
      if (cls) {
        const level = db.prepare(
          'SELECT * FROM levels WHERE class_id = ? ORDER BY level_number LIMIT 1'
        ).get(classId);
        if (level) {
          operations = level.operations;
          minNum = level.min_number;
          maxNum = level.max_number;
        }
      }
    }

    const question = generateQuestion(operations, minNum, maxNum);
    res.json(question);
  } catch (err) {
    console.error('Question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/game/result
router.post('/result', authenticateToken, (req, res) => {
  try {
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

    const db = getDb();
    const userId = req.user.id;

    // Calculate points
    const basePoints = playerScore * 10;
    const streakBonus = streak * 5;
    const winBonus = won ? 50 : 0;
    const totalPoints = basePoints + streakBonus + winBonus;

    // Update user stats
    db.prepare(`
      UPDATE users SET
        total_points = total_points + ?,
        matches_played = matches_played + 1,
        wins = wins + ?,
        losses = losses + ?,
        accuracy = ROUND((accuracy * matches_played + ?) / (matches_played + 1), 1),
        best_streak = MAX(best_streak, ?),
        level = MAX(level, ?)
      WHERE id = ?
    `).run(
      totalPoints,
      won ? 1 : 0,
      won ? 0 : 1,
      accuracy || 0,
      streak,
      Math.floor(db.prepare('SELECT total_points FROM users WHERE id = ?').get(userId).total_points / 500) + 1,
      userId
    );

    // Record match
    db.prepare(`
      INSERT INTO match_history (player1_id, player1_score, player2_score, winner_id, mode, class_id, level_id, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      playerScore,
      opponentScore,
      won ? userId : null,
      mode || 'single',
      classId || null,
      levelId || null,
      duration || null
    );

    // Update level progress
    if (levelId && won) {
      const stars = playerScore >= totalQuestions ? 3 : playerScore >= totalQuestions * 0.7 ? 2 : 1;
      const existing = db.prepare(
        'SELECT * FROM user_progress WHERE user_id = ? AND level_id = ?'
      ).get(userId, levelId);

      if (existing) {
        db.prepare(`
          UPDATE user_progress SET
            stars = MAX(stars, ?),
            best_score = MAX(best_score, ?),
            completed = 1
          WHERE user_id = ? AND level_id = ?
        `).run(stars, playerScore, userId, levelId);
      } else {
        db.prepare(`
          INSERT INTO user_progress (user_id, class_id, level_id, stars, best_score, completed)
          VALUES (?, ?, ?, ?, ?, 1)
        `).run(userId, classId, levelId, stars, playerScore);
      }
    }

    const updatedUser = db.prepare(
      'SELECT total_points, matches_played, wins, losses, level, best_streak FROM users WHERE id = ?'
    ).get(userId);

    res.json({
      pointsEarned: totalPoints,
      breakdown: { basePoints, streakBonus, winBonus },
      updatedStats: updatedUser,
    });
  } catch (err) {
    console.error('Result error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

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
