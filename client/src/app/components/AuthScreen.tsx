import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useState } from 'react';
import { apiLogin, apiRegister, apiGuest } from '../../lib/api';

type Mode = 'landing' | 'login' | 'signup';

export default function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await apiLogin(email, password);
      } else {
        await apiRegister(username, email, password);
      }
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setLoading(true);
    try {
      await apiGuest();
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-auto relative">
      {/* Decorative floating elements */}
      <div className="absolute top-[10%] left-[6%] text-3xl sm:text-4xl animate-float opacity-30 pointer-events-none">🧮</div>
      <div className="absolute top-[20%] right-[8%] text-3xl sm:text-4xl animate-float opacity-30 pointer-events-none" style={{ animationDelay: '1s' }}>✨</div>
      <div className="absolute bottom-[15%] left-[10%] text-3xl sm:text-4xl animate-float opacity-30 pointer-events-none" style={{ animationDelay: '0.5s' }}>🎯</div>
      <div className="absolute bottom-[25%] right-[6%] text-3xl sm:text-4xl animate-float opacity-30 pointer-events-none" style={{ animationDelay: '1.5s' }}>⭐</div>

      <div className="min-h-full flex flex-col items-center justify-center max-w-md mx-auto p-4 sm:p-6 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-4 sm:mb-6"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-white/30">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl leading-none">🪢</div>
              <div className="text-lg sm:text-xl mt-0.5">➕✖️</div>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl text-white font-extrabold text-center mb-1 drop-shadow-md"
        >
          Math Tug of War
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm sm:text-base text-white/70 text-center mb-6 sm:mb-8"
        >
          {mode === 'landing' ? 'Ready to play? Jump in!' : mode === 'login' ? 'Welcome back!' : 'Create your account'}
        </motion.p>

        {/* Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full bg-white/95 backdrop-blur-md rounded-[1.5rem] p-5 sm:p-7 shadow-2xl"
        >
          {mode === 'landing' ? (
            /* Landing — Login / Signup / Guest */
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => setMode('login')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg sm:text-xl font-bold py-4 sm:py-5 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xl sm:text-2xl">🔑</span>
                Log In
              </button>

              <button
                onClick={() => setMode('signup')}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-lg sm:text-xl font-bold py-4 sm:py-5 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xl sm:text-2xl">✏️</span>
                Sign Up
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs sm:text-sm text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={handleGuest}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white text-lg sm:text-xl font-bold py-4 sm:py-5 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="text-xl sm:text-2xl">🎮</span>
                {loading ? 'Loading...' : 'Play as Guest'}
              </button>
            </div>
          ) : (
            /* Login / Signup Form */
            <div className="space-y-3 sm:space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 font-medium mb-1 block">Username</label>
                  <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-3 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                    <span className="text-lg sm:text-xl mr-2">👤</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a fun name"
                      className="flex-1 bg-transparent outline-none text-sm sm:text-base text-gray-800 placeholder:text-gray-300 font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs sm:text-sm text-gray-500 font-medium mb-1 block">Email</label>
                <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-lg sm:text-xl mr-2">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent outline-none text-sm sm:text-base text-gray-800 placeholder:text-gray-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-500 font-medium mb-1 block">Password</label>
                <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="text-lg sm:text-xl mr-2">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent outline-none text-sm sm:text-base text-gray-800 placeholder:text-gray-300 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs sm:text-sm text-red-500 font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full text-white text-lg sm:text-xl font-bold py-4 sm:py-5 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-60 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-green-400 to-emerald-500'
                }`}
              >
                {loading ? 'Loading...' : mode === 'login' ? 'Log In 🚀' : 'Create Account ✨'}
              </button>

              <button
                onClick={() => { setMode('landing'); setEmail(''); setPassword(''); setUsername(''); }}
                className="w-full text-gray-400 hover:text-gray-600 text-sm sm:text-base font-medium py-2 transition-colors"
              >
                ← Back
              </button>

              {mode === 'login' ? (
                <p className="text-center text-xs sm:text-sm text-gray-400">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-purple-500 font-bold hover:underline">Sign Up</button>
                </p>
              ) : (
                <p className="text-center text-xs sm:text-sm text-gray-400">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-blue-500 font-bold hover:underline">Log In</button>
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/40 text-[10px] sm:text-xs text-center mt-5 sm:mt-6"
        >
          By continuing, you agree to our Terms & Privacy Policy
        </motion.p>
      </div>
    </div>
  );
}
