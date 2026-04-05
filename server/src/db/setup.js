const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function getDb() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || './data/database.sqlite';
  const fullPath = path.resolve(__dirname, '../../', dbPath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(fullPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initTables(db);
  seedData(db);

  return db;
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      avatar TEXT DEFAULT '👦',
      is_guest INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      matches_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      accuracy REAL DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT NOT NULL,
      unlock_level INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      level_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      operations TEXT NOT NULL,
      min_number INTEGER DEFAULT 1,
      max_number INTEGER DEFAULT 20,
      questions_count INTEGER DEFAULT 10,
      time_limit INTEGER DEFAULT 60,
      stars_required INTEGER DEFAULT 0,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      level_id INTEGER NOT NULL,
      stars INTEGER DEFAULT 0,
      best_score INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (level_id) REFERENCES levels(id),
      UNIQUE(user_id, level_id)
    );

    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT,
      player1_id TEXT NOT NULL,
      player2_id TEXT,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      winner_id TEXT,
      mode TEXT DEFAULT 'single',
      class_id INTEGER,
      level_id INTEGER,
      duration INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player1_id) REFERENCES users(id)
    );
  `);
}

function seedData(db) {
  const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get();
  if (classCount.count > 0) return;

  const insertClass = db.prepare(
    'INSERT INTO classes (id, name, emoji, color, description, unlock_level) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const classes = [
    [1, 'Class 1', '🌱', 'from-green-400 to-emerald-500', 'Addition Basics', 1],
    [2, 'Class 2', '🌿', 'from-blue-400 to-cyan-500', 'Subtraction Fun', 1],
    [3, 'Class 3', '🌳', 'from-purple-400 to-violet-500', 'Multiplication', 3],
    [4, 'Class 4', '🎯', 'from-orange-400 to-red-500', 'Division World', 5],
    [5, 'Class 5', '🏆', 'from-yellow-400 to-amber-500', 'Mixed Challenge', 7],
  ];

  const insertLevel = db.prepare(
    'INSERT INTO levels (class_id, level_number, name, operations, min_number, max_number, questions_count, time_limit, stars_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (const c of classes) {
      insertClass.run(...c);
    }

    // Class 1: Addition
    for (let i = 1; i <= 5; i++) {
      insertLevel.run(1, i, `Level ${i}`, '+', 1, 10 + i * 5, 10, 60, (i - 1) * 2);
    }
    // Class 2: Subtraction
    for (let i = 1; i <= 5; i++) {
      insertLevel.run(2, i, `Level ${i}`, '-', 1, 10 + i * 5, 10, 60, (i - 1) * 2);
    }
    // Class 3: Multiplication
    for (let i = 1; i <= 5; i++) {
      insertLevel.run(3, i, `Level ${i}`, '*', 1, 5 + i * 2, 10, 90, (i - 1) * 2);
    }
    // Class 4: Division
    for (let i = 1; i <= 5; i++) {
      insertLevel.run(4, i, `Level ${i}`, '/', 1, 5 + i * 2, 10, 90, (i - 1) * 2);
    }
    // Class 5: Mixed
    for (let i = 1; i <= 5; i++) {
      insertLevel.run(5, i, `Level ${i}`, '+-*/', 1, 10 + i * 5, 10, 60, (i - 1) * 2);
    }
  });

  transaction();
  console.log('✅ Database seeded with classes and levels');
}

module.exports = { getDb };
