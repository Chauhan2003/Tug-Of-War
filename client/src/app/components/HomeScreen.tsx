import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../../lib/useAuth';
import { isLoggedIn } from '../../lib/api';
import { useEffect, useState } from 'react';
import JoinRoomModal from './JoinRoomModal';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/auth');
    }
  }, [navigate]);

  const cards = [
    {
      title: 'Play Game',
      subtitle: 'Start a new match!',
      emoji: '🎮',
      gradient: 'from-green-400 to-emerald-600',
      route: '/class-selection',
      large: true,
    },
    {
      title: 'Practice Mode',
      subtitle: 'Improve your skills',
      emoji: '🧠',
      gradient: 'from-purple-400 to-pink-500',
      route: '/mode-selection',
    },
    {
      title: 'Leaderboard',
      subtitle: 'See top players',
      emoji: '🏆',
      gradient: 'from-yellow-400 to-orange-500',
      route: '/leaderboard',
    },
  ];

  return (
    <div className="size-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4 scrollbar-hide">
          {cards.map((card, index) => (
            <motion.button
              key={card.title}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 * (index + 1), type: 'spring', stiffness: 300, damping: 24 }}
              onClick={() => navigate(card.route)}
              className={`w-full bg-gradient-to-r ${card.gradient} rounded-[1.25rem] sm:rounded-[1.5rem] ${
                card.large ? 'p-5 sm:p-7' : 'p-4 sm:p-5'
              } shadow-xl hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.97] transition-all duration-200`}
            >
              <div className="flex items-center justify-between text-white">
                <div className="text-left">
                  <div className={`${card.large ? 'text-3xl sm:text-4xl mb-1.5' : 'text-2xl sm:text-3xl mb-1'}`}>
                    {card.emoji}
                  </div>
                  <h3 className={`font-bold ${card.large ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} mb-0.5`}>
                    {card.title}
                  </h3>
                  <p className={`${card.large ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} opacity-90`}>
                    {card.subtitle}
                  </p>
                </div>
                <div className={`${card.large ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'} opacity-80`}>
                  ▶️
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Bottom Navigation — fixed at bottom, no animation */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 sm:py-3 rounded-t-[1.5rem] shadow-xl shrink-0">
          <div className="flex justify-around items-center max-w-xs mx-auto">
            {[
              { icon: '🏠', label: 'Home', active: true, route: '/home' },
              { icon: '🎮', label: 'Join', active: false, route: '' },
              { icon: '👤', label: 'Profile', active: false, route: '/profile' },
              { icon: '📊', label: 'Ranks', active: false, route: '/leaderboard' },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => tab.label === 'Join' ? setShowJoinModal(true) : navigate(tab.route)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                  tab.active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="text-xl sm:text-2xl">{tab.icon}</div>
                <span className="text-[10px] sm:text-xs font-medium">{tab.label}</span>
                {tab.active && <div className="w-5 h-1 bg-blue-500 rounded-full mt-0.5" />}
              </button>
            ))}
          </div>
        </div>

        <JoinRoomModal open={showJoinModal} onClose={() => setShowJoinModal(false)} />
      </div>
    </div>
  );
}
