const express = require('express');
const { getDb } = require('../db/mongodb');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne(
      { id: req.user.id },
      {
        projection: {
          id: 1,
          username: 1,
          email: 1,
          avatar: 1,
          is_guest: 1,
          total_points: 1,
          matches_played: 1,
          wins: 1,
          losses: 1,
          accuracy: 1,
          best_streak: 1,
          level: 1,
          created_at: 1
        }
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rank = await db.collection('users').countDocuments({ total_points: { $gt: user.total_points } });

    const progress = await db.collection('user_progress').aggregate([
      { $match: { user_id: req.user.id } },
      {
        $lookup: {
          from: 'classes',
          localField: 'class_id',
          foreignField: 'id',
          as: 'class'
        }
      },
      {
        $lookup: {
          from: 'levels',
          localField: 'level_id',
          foreignField: '_id',
          as: 'level'
        }
      },
      { $unwind: '$class' },
      { $unwind: '$level' },
      {
        $project: {
          class_id: 1,
          level_id: 1,
          stars: 1,
          best_score: 1,
          completed: 1,
          class_name: '$class.name',
          level_number: '$level.level_number'
        }
      },
      { $sort: { class_id: 1, level_number: 1 } }
    ]).toArray();

    const recentMatches = await db.collection('match_history')
      .find({
        $or: [{ player1_id: req.user.id }, { player2_id: req.user.id }]
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray()
      .then(matches => matches.map(match => ({
        ...match,
        won: match.winner_id === req.user.id ? 1 : 0
      })));

    res.json({
      ...user,
      rank: rank + 1,
      progress,
      recentMatches,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/profile
router.patch('/', authenticateToken, async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const db = await getDb();
    const updateData = {};

    if (username) {
      const existing = await db.collection('users').findOne({ 
        username, 
        id: { $ne: req.user.id } 
      });
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updateData.username = username;
    }

    if (avatar) {
      updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length > 0) {
      await db.collection('users').updateOne(
        { id: req.user.id },
        { $set: updateData }
      );
    }

    const user = await db.collection('users').findOne(
      { id: req.user.id },
      {
        projection: {
          id: 1,
          username: 1,
          avatar: 1,
          total_points: 1,
          level: 1
        }
      }
    );
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
