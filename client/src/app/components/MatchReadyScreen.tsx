import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { connectSocket } from '../../lib/socket';
import { useAuth } from '../../lib/useAuth';

export default function MatchReadyScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(3);
  const multiplayerState = (location.state as any) || {};
  const isMultiplayer = !!multiplayerState.roomCode;

  // Listen for game-start event in multiplayer
  useEffect(() => {
    if (!isMultiplayer) return;

    const socket = connectSocket();
    socket.on('game-start', (data: any) => {
      navigate('/multiplayer-game', {
        state: {
          roomCode: multiplayerState.roomCode,
          opponent: data.opponent,
          myIndex: data.myIndex,
          myPlayerId: user?.id,
          timeLimit: data.timeLimit,
          totalQuestions: data.totalQuestions,
          firstQuestion: data.question,
        },
        replace: true,
      });
    });

    return () => {
      socket.off('game-start');
    };
  }, [isMultiplayer, navigate, multiplayerState.roomCode, user]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!isMultiplayer) {
      // Single-player: go to regular game
      const timer = setTimeout(() => navigate('/game'), 600);
      return () => clearTimeout(timer);
    }
    // For multiplayer, we wait for the game-start socket event
  }, [countdown, navigate, isMultiplayer]);

  return (
    <div className="size-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto px-4 sm:px-5 overflow-y-auto scrollbar-hide">
        {/* VS Section */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="w-full bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-2xl mb-4 sm:mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            {/* Player A */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center flex-1"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-xl mb-1.5">
                👦
              </div>
              <h3 className="text-sm sm:text-base text-gray-800 font-bold">You</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">MathKid123</p>
            </motion.div>

            {/* VS Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 6 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
              className="px-1.5 sm:px-3"
            >
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xl sm:text-2xl font-extrabold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl">
                VS
              </div>
            </motion.div>

            {/* Player B */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center flex-1"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-xl mb-1.5">
                {isMultiplayer ? '👤' : '🤖'}
              </div>
              <h3 className="text-sm sm:text-base text-gray-800 font-bold">Opponent</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {isMultiplayer
                  ? (multiplayerState.players?.[1]?.username || 'Player 2')
                  : 'NumberBot'}
              </p>
            </motion.div>
          </div>

          {/* Match Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
            <div className="flex items-center justify-between text-gray-600">
              {[
                { emoji: '⭐', label: 'Level 3' },
                { emoji: '🔢', label: '10 Questions' },
                { emoji: '⏱️', label: '60 Seconds' },
              ].map((info, i) => (
                <div key={info.label} className="flex items-center">
                  {i > 0 && <div className="w-px h-6 bg-gray-200 mx-1" />}
                  <div className="text-center flex-1 px-1">
                    <div className="text-base sm:text-lg mb-0.5">{info.emoji}</div>
                    <p className="text-[9px] sm:text-[10px] font-medium">{info.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Countdown */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            {countdown > 0 ? (
              <motion.div
                key={countdown}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <p className="text-white text-base sm:text-lg mb-2 font-semibold drop-shadow-md">Game starts in...</p>
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {countdown}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="go"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <p className="text-white text-lg sm:text-xl mb-2 font-bold drop-shadow-md">GO!</p>
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="text-4xl sm:text-5xl">🚀</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Motivational Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 sm:mt-5 text-center"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl py-2 px-4 shadow-lg inline-block">
            <p className="text-sm sm:text-base text-gray-700 font-semibold">Good Luck! 🍀</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
