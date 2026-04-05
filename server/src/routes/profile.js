const express = require('express');
const { getDb } = require('../db/setup');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, username, email, avatar, is_guest, total_points, matches_played,
             wins, losses, accuracy, best_streak, level, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rank = db.prepare(
      'SELECT COUNT(*) + 1 as rank FROM users WHERE total_points > ?'
    ).get(user.total_points);

    const progress = db.prepare(`
      SELECT up.class_id, up.level_id, up.stars, up.best_score, up.completed,
             c.name as class_name, l.level_number
      FROM user_progress up
      JOIN classes c ON c.id = up.class_id
      JOIN levels l ON l.id = up.level_id
      WHERE up.user_id = ?
      ORDER BY up.class_id, l.level_number
    `).all(req.user.id);

    const recentMatches = db.prepare(`
      SELECT mh.*, 
        CASE WHEN mh.winner_id = ? THEN 1 ELSE 0 END as won
      FROM match_history mh
      WHERE mh.player1_id = ? OR mh.player2_id = ?
      ORDER BY mh.created_at DESC
      LIMIT 10
    `).all(req.user.id, req.user.id, req.user.id);

    res.json({
      ...user,
      rank: rank.rank,
      progress,
      recentMatches,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/profile
router.patch('/', authenticateToken, (req, res) => {
  try {
    const { username, avatar } = req.body;
    const db = getDb();

    if (username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.user.id);
    }

    if (avatar) {
      db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
    }

    const user = db.prepare('SELECT id, username, avatar, total_points, level FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
