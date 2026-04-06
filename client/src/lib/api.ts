const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function setToken(token: string) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function setStoredUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// --- Auth ---
export async function apiRegister(username: string, email: string, password: string) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function apiGuest() {
  const data = await request('/auth/guest', { method: 'POST' });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export function apiLogout() {
  clearToken();
}

// --- Profile ---
export async function apiGetProfile() {
  return request('/profile');
}

export async function apiUpdateProfile(updates: { username?: string; avatar?: string }) {
  return request('/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// --- Leaderboard ---
export async function apiGetLeaderboard(limit = 50, offset = 0) {
  return request(`/leaderboard?limit=${limit}&offset=${offset}`);
}

// --- Game ---
export async function apiGetClasses() {
  return request('/game/classes');
}

export async function apiGetLevels(classId: number) {
  return request(`/game/classes/${classId}/levels`);
}

export async function apiGetQuestion(classId?: number, levelId?: number) {
  return request('/game/question', {
    method: 'POST',
    body: JSON.stringify({ classId, levelId }),
  });
}

// AI-powered question generation
export async function apiGetAIQuestions(classId: number, levelId: string) {
  return request('/game/questions', {
    method: 'POST',
    body: JSON.stringify({ classId, levelId }),
  });
}

// AI service status
export async function apiGetAIStatus() {
  return request('/game/ai-status');
}

// Clear AI questions cache
export async function apiClearAICache(classId: number, levelId: string) {
  return request(`/game/cache/${classId}/${levelId}`, {
    method: 'DELETE',
  });
}

export async function apiSubmitResult(result: {
  mode: string;
  classId?: number;
  levelId?: number | string;
  playerScore: number;
  opponentScore: number;
  totalQuestions: number;
  streak: number;
  accuracy: number;
  duration: number;
  won: boolean;
}) {
  return request('/game/result', {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

// --- Utility ---
export function isLoggedIn() {
  return !!getToken();
}

export { getToken, getStoredUser, setStoredUser };
