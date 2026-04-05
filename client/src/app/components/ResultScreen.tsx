import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';

export default function ResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { score, streak, totalQuestions } = location.state || { score: { player1: 7, player2: 3 }, streak: 5, totalQuestions: 10 };

  const playerWon = score.player1 > score.player2;
  const accuracy = Math.round((score.player1 / totalQuestions) * 100);
  const stars = accuracy >= 80 ? 3 : accuracy >= 60 ? 2 : accuracy >= 40 ? 1 : 0;

  const confettiItems = useMemo(() =>
    [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
      emoji: ['🎉', '⭐', '🏆', '✨', '🎊'][Math.floor(Math.random() * 5)],
    })), []
  );

  return (
    <div className="size-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 relative">
      {/* Confetti */}
      {playerWon && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {confettiItems.map((item) => (
            <div
              key={item.id}
              className="absolute text-xl sm:text-2xl animate-confetti-fall"
              style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration }}
            >
              {item.emoji}
            </div>
          ))}
        </div>
      )}

      <div className="h-full overflow-y-auto scrollbar-hide flex flex-col items-center justify-center px-4 sm:px-5 py-4 relative z-20">
        <div className="w-full max-w-md space-y-2.5 sm:space-y-3">
          {/* Winner Announcement */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              className="text-5xl sm:text-6xl mb-2"
            >
              {playerWon ? '🏆' : '💪'}
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {playerWon ? 'You Win!' : 'Try Again!'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {playerWon ? 'Amazing job! Keep it up!' : 'Great effort! Practice makes perfect!'}
            </p>
          </motion.div>

          {/* Score Comparison */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-xl"
          >
            <p className="text-center text-[10px] sm:text-xs text-gray-400 font-medium mb-2">Final Score</p>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg mb-1">
                  👦
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">You</p>
                <p className="text-xl sm:text-2xl text-gray-800 font-extrabold">{score.player1}</p>
              </div>
              <div className="text-xl sm:text-2xl text-gray-300 font-bold">—</div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg mb-1">
                  🤖
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">Robot</p>
                <p className="text-xl sm:text-2xl text-gray-800 font-extrabold">{score.player2}</p>
              </div>
            </div>
          </motion.div>

          {/* Stars & Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-xl"
          >
            {/* Stars */}
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: i <= stars ? 1 : 0.7, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.2, type: 'spring', stiffness: 300 }}
                  className={`text-2xl sm:text-3xl ${i <= stars ? '' : 'opacity-25 grayscale'}`}
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <div className="space-y-2.5">
              {/* Accuracy */}
              <div>
                <div className="flex justify-between text-[10px] sm:text-xs mb-1">
                  <span className="text-gray-500 font-medium">Accuracy</span>
                  <span className="text-gray-700 font-bold">{accuracy}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy}%` }}
                    transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-orange-50 rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-center">
                  <p className="text-sm sm:text-base font-bold text-orange-600">🔥 {streak}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Best Streak</p>
                </div>
                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-center">
                  <p className="text-sm sm:text-base font-bold text-blue-600">{score.player1}/{totalQuestions}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Correct</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <button
              onClick={() => navigate('/game')}
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-base sm:text-lg font-bold py-3.5 sm:py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              Play Again 🎮
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/mode-selection')}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xs sm:text-sm font-bold py-3 sm:py-3.5 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all"
              >
                Change Mode
              </button>
              <button
                onClick={() => navigate('/home')}
                className="bg-gradient-to-r from-purple-400 to-pink-500 text-white text-xs sm:text-sm font-bold py-3 sm:py-3.5 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all"
              >
                Go Home 🏠
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
