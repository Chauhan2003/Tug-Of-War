const express = require('express');
const { getDb } = require('../db/mongodb');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard
router.get('/', optionalAuth, async (req, res) => {
  try {
    const db = await getDb();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const players = await db.collection('users')
      .find({})
      .sort({ total_points: -1 })
      .skip(offset)
      .limit(limit)
      .project({
        id: 1,
        username: 1,
        avatar: 1,
        total_points: 1,
        wins: 1,
        losses: 1,
        matches_played: 1,
        level: 1
      })
      .toArray();

    const total = await db.collection('users').countDocuments();

    let currentUserRank = null;
    if (req.user) {
      const usersWithHigherScore = await db.collection('users').countDocuments({
        total_points: { $gt: req.user.total_points || 0 }
      });
      currentUserRank = usersWithHigherScore + 1;
    }

    res.json({
      players: players.map((p, index) => ({
        ...p,
        rank: offset + index + 1,
        isCurrentUser: req.user ? p.id === req.user.id : false,
      })),
      total,
      currentUserRank,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
