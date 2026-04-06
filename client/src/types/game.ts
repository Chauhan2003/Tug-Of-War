// Game-related type definitions

export interface Question {
  id: number;
  question: string;
  num1: number;
  num2: number;
  operation: string;
  answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'general';
}

export interface AIQuestionsResponse {
  status: 'success' | 'error';
  data: {
    questions: Question[];
    metadata: {
      totalQuestions: number;
      operations: string[];
      difficulty: string;
      estimatedTime: number;
      fallback?: boolean;
    };
  };
  metadata: {
    generated: string;
    userId: string;
    aiGenerated: boolean;
  };
}

export interface GameResult {
  mode: 'single' | 'multiplayer';
  classId?: number;
  levelId?: string;
  playerScore: number;
  opponentScore: number;
  totalQuestions: number;
  streak: number;
  accuracy: number;
  duration: number;
  won: boolean;
}

export interface GameSession {
  classId: number;
  levelId: string;
  questions: Question[];
  currentIndex: number;
  score: {
    player1: number;
    player2: number;
  };
  streak: number;
  startTime: Date;
  timeLimit: number;
}

export interface Class {
  id: number;
  name: string;
  emoji: string;
  color: string;
  description: string;
  unlock_level: number;
  unlocked: boolean;
}

export interface Level {
  _id: string;
  id: string;
  class_id: number;
  level_number: number;
  name: string;
  operations: string;
  min_number: number;
  max_number: number;
  questions_count: number;
  time_limit: number;
  stars_required: number;
  stars: number;
  best_score: number;
  completed: number;
  unlocked: boolean;
}

export interface AIStatus {
  status: 'success' | 'error';
  data: {
    status: 'connected' | 'disconnected';
    model: string;
    cacheEnabled: boolean;
    cacheTTL: number;
    error?: string;
  };
}
