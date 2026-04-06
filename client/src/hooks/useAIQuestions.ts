import { useState, useCallback } from 'react';
import { apiGetAIQuestions, apiGetAIStatus } from '../lib/api';
import type { AIQuestionsResponse, Question, AIStatus } from '../types/game';

interface UseAIQuestionsOptions {
  classId: number;
  levelId: string;
  enabled?: boolean;
}

interface UseAIQuestionsReturn {
  questions: Question[];
  loading: boolean;
  error: string | null;
  aiStatus: AIStatus | null;
  isAIGenerated: boolean;
  fetchQuestions: () => Promise<void>;
  reset: () => void;
  refreshStatus: () => Promise<void>;
}

export function useAIQuestions({ classId, levelId, enabled = true }: UseAIQuestionsOptions): UseAIQuestionsReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!enabled || !classId || !levelId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: AIQuestionsResponse = await apiGetAIQuestions(classId, levelId);
      
      if (response.status === 'success') {
        setQuestions(response.data.questions);
        setIsAIGenerated(response.metadata.aiGenerated);
        
        // Log if fallback was used
        if (response.data.metadata.fallback) {
          console.warn('AI questions unavailable, using fallback generation');
        }
      } else {
        throw new Error('Failed to generate questions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setQuestions([]);
      setIsAIGenerated(false);
    } finally {
      setLoading(false);
    }
  }, [classId, levelId, enabled]);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await apiGetAIStatus();
      setAiStatus(status);
    } catch (err) {
      console.warn('Failed to fetch AI status:', err);
      setAiStatus(null);
    }
  }, []);

  const reset = useCallback(() => {
    setQuestions([]);
    setError(null);
    setLoading(false);
    setIsAIGenerated(false);
  }, []);

  return {
    questions,
    loading,
    error,
    aiStatus,
    isAIGenerated,
    fetchQuestions,
    reset,
    refreshStatus,
  };
}

// Helper function to format question display
export function formatQuestion(question: Question): string {
  return question.question;
}

// Helper function to get operation symbol
export function getOperationSymbol(operation: string): string {
  switch (operation) {
    case '+': return '+';
    case '-': return '-';
    case '*': return '×';
    case '/': return '÷';
    default: return operation;
  }
}

// Helper function to get difficulty color
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'hard': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

// Helper function to get category icon
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'addition': return '➕';
    case 'subtraction': return '➖';
    case 'multiplication': return '✖️';
    case 'division': return '➗';
    default: return '🔢';
  }
}
