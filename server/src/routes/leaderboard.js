const express = require('express');
const { getDb } = require('../db/setup');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const players = db.prepare(`
      SELECT id, username, avatar, total_points, wins, losses, matches_played, level,
             ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
      FROM users
      ORDER BY total_points DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM users').get();

    let currentUserRank = null;
    if (req.user) {
      currentUserRank = db.prepare(`
        SELECT rank FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank FROM users
        ) WHERE id = ?
      `).get(req.user.id);
    }

    res.json({
      players: players.map((p) => ({
        ...p,
        isCurrentUser: req.user ? p.id === req.user.id : false,
      })),
      total: total.count,
      currentUserRank: currentUserRank ? currentUserRank.rank : null,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
