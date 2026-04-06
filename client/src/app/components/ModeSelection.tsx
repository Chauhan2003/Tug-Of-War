import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';

const modes = [
  {
    id: 'multiplayer',
    title: 'Multiplayer',
    emoji: '👥',
    description: 'Play against friends online',
    color: 'from-blue-400 to-cyan-500',
    route: '/multiplayer-lobby',
  },
  {
    id: 'single',
    title: 'Single Device',
    emoji: '📱',
    description: 'Play with a friend on one device',
    color: 'from-purple-400 to-pink-500',
    route: '/match-ready',
  },
  {
    id: 'practice',
    title: 'AI Practice',
    emoji: '�',
    description: 'Play with AI-generated questions',
    color: 'from-green-400 to-emerald-500',
    route: '/ai-game',
  },
];

export default function ModeSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameState = location.state;

  return (
    <div className="size-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Header — pinned */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 shrink-0"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-lg sm:text-xl shadow-lg active:scale-95 transition-transform shrink-0"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl text-white font-bold drop-shadow-md">Choose Game Mode</h1>
        </motion.div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-center gap-3 sm:gap-4 px-4 sm:px-5 pb-4">
          {modes.map((mode, index) => (
            <motion.button
              key={mode.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * (index + 1), type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => navigate(mode.route, { state: gameState })}
              className={`w-full bg-gradient-to-r ${mode.color} rounded-[1.25rem] sm:rounded-[1.5rem] p-5 sm:p-6 shadow-xl hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.97] transition-all duration-200`}
            >
              <div className="text-center text-white">
                <div className="text-4xl sm:text-5xl mb-1.5 sm:mb-2">{mode.emoji}</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-0.5">{mode.title}</h3>
                <p className="text-xs sm:text-sm opacity-90">{mode.description}</p>
              </div>
            </motion.button>
          ))}

          {/* Info Box */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="text-2xl sm:text-3xl shrink-0">🤖</div>
              <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                Try AI Practice mode for personalized questions with explanations! Or choose multiplayer to compete with players worldwide.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
