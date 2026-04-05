# Tug of War - Backend Server

Node.js backend for the Math Tug of War game.

## Tech Stack
- **Express** — REST API
- **Socket.IO** — Real-time multiplayer
- **better-sqlite3** — Database
- **JWT** — Authentication
- **bcryptjs** — Password hashing

## Setup

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:3001` by default.

## API Endpoints

### Auth
- `POST /api/auth/register` — Register with username, email, password
- `POST /api/auth/login` — Login with email, password
- `POST /api/auth/guest` — Create guest account

### Profile
- `GET /api/profile` — Get user profile (auth required)
- `PATCH /api/profile` — Update username/avatar (auth required)

### Leaderboard
- `GET /api/leaderboard` — Get top players (optional auth)

### Game
- `GET /api/game/classes` — Get all classes (auth required)
- `GET /api/game/classes/:id/levels` — Get levels for a class
- `POST /api/game/question` — Get a random question
- `POST /api/game/result` — Submit game result

### Socket.IO Events

**Client → Server:**
- `create-room` — Create multiplayer room
- `join-room` — Join with room code
- `submit-answer` — Submit answer during game
- `leave-room` — Leave current room

**Server → Client:**
- `player-joined` — Opponent joined room
- `match-ready` — Both players ready, countdown starts
- `game-start` — Game begins with first question
- `game-update` — Score/rope update after each answer
- `next-question` — Next question for the player
- `timer-tick` — Time remaining
- `game-over` — Game finished with results
- `player-left` — Opponent disconnected
