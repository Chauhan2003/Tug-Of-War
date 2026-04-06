const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/mongodb');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, is_guest: user.is_guest },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const db = await getDb();

    const existing = await db.collection('users').findOne({
      $or: [{ email }, { username }]
    });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);

    const newUser = {
      id,
      username,
      email,
      password_hash,
      is_guest: 0,
      avatar: '👦',
      total_points: 0,
      matches_played: 0,
      wins: 0,
      losses: 0,
      accuracy: 0,
      best_streak: 0,
      level: 1,
      created_at: new Date().toISOString()
    };

    await db.collection('users').insertOne(newUser);

    const user = await db.collection('users').findOne({ id });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        total_points: user.total_points,
        level: user.level,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        total_points: user.total_points,
        level: user.level,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
  try {
    const db = await getDb();
    const id = uuidv4();
    const guestNum = Math.floor(Math.random() * 9000) + 1000;
    const username = `Guest_${guestNum}`;
    const avatars = ['👦', '👧', '🧒', '👶', '🐱', '🐶', '🦊', '🐻'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newUser = {
      id,
      username,
      avatar,
      is_guest: 1,
      total_points: 0,
      matches_played: 0,
      wins: 0,
      losses: 0,
      accuracy: 0,
      best_streak: 0,
      level: 1,
      created_at: new Date().toISOString()
    };

    await db.collection('users').insertOne(newUser);

    const user = await db.collection('users').findOne({ id });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        total_points: user.total_points,
        level: user.level,
        is_guest: true,
      },
    });
  } catch (err) {
    console.error('Guest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
