import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { apiGetLeaderboard } from '../../lib/api';
import JoinRoomModal from './JoinRoomModal';

const medals = ['', '🏆', '�', '🥉'];
const rankColors = [
  '',
  'from-yellow-400 to-amber-500',
  'from-gray-300 to-gray-400',
  'from-orange-400 to-orange-600',
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    apiGetLeaderboard()
      .then((data) => {
        setLeaderboardData(
          data.players.map((p: any) => ({
            rank: p.rank,
            name: p.username,
            points: p.total_points,
            avatar: p.avatar || '�',
            color: rankColors[p.rank] || 'from-blue-400 to-blue-500',
            isCurrentUser: p.isCurrentUser,
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="size-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-white text-lg font-bold animate-pulse">Loading...</div>
            </div>
          )}
          {/* Top 3 Podium */}
          {leaderboardData.length >= 3 && <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3 sm:p-4 shadow-xl">
              <div className="flex items-end justify-center gap-1.5 sm:gap-2">
                {/* 2nd Place */}
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-xl sm:text-2xl mb-1 shadow-lg">
                    {leaderboardData[1].avatar}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-gray-600 truncate mb-0.5 font-medium">{leaderboardData[1].name}</p>
                  <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg sm:rounded-t-xl p-1.5 sm:p-2 text-white h-16 sm:h-20 flex flex-col items-center justify-center">
                    <div className="text-lg sm:text-xl">🥈</div>
                    <p className="text-[10px] sm:text-xs font-bold">{leaderboardData[1].points.toLocaleString()}</p>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-1 shadow-xl animate-float">
                    {leaderboardData[0].avatar}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-gray-600 truncate mb-0.5 font-medium">{leaderboardData[0].name}</p>
                  <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg sm:rounded-t-xl p-1.5 sm:p-2 text-white h-22 sm:h-26 flex flex-col items-center justify-center">
                    <div className="text-xl sm:text-2xl">🏆</div>
                    <p className="text-xs sm:text-sm font-bold">{leaderboardData[0].points.toLocaleString()}</p>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-xl sm:text-2xl mb-1 shadow-lg">
                    {leaderboardData[2].avatar}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-gray-600 truncate mb-0.5 font-medium">{leaderboardData[2].name}</p>
                  <div className="bg-gradient-to-b from-orange-400 to-orange-600 rounded-t-lg sm:rounded-t-xl p-1.5 sm:p-2 text-white h-12 sm:h-16 flex flex-col items-center justify-center">
                    <div className="text-lg sm:text-xl">🥉</div>
                    <p className="text-[10px] sm:text-xs font-bold">{leaderboardData[2].points.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>}

          {/* Full Rankings List */}
          <div className="px-4 sm:px-5 pb-3">
            <div className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3 sm:p-4 shadow-xl">
              <h3 className="text-xs sm:text-sm text-gray-700 font-bold mb-1.5 px-1">All Rankings</h3>
              <div className="space-y-1 sm:space-y-1.5">
                {leaderboardData.map((player, index) => (
                  <motion.div
                    key={player.rank}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.03 * index }}
                    className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${
                      player.isCurrentUser
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-400 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                      player.rank <= 3
                        ? `bg-gradient-to-br ${player.color} text-white shadow-sm`
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {player.rank <= 3 ? medals[player.rank] : player.rank}
                    </div>

                    {/* Avatar */}
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br ${player.color} rounded-full flex items-center justify-center text-base sm:text-lg shadow-sm shrink-0`}>
                      {player.avatar}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-800 font-semibold truncate">
                        {player.name}
                        {player.isCurrentUser && <span className="text-blue-500 ml-1 text-[10px] font-bold">(You)</span>}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sm:text-xs text-gray-600 font-bold">⭐ {player.points.toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation — pinned, no animation */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 sm:py-3 rounded-t-[1.5rem] shadow-xl shrink-0">
          <div className="flex justify-around items-center max-w-xs mx-auto">
            {[
              { icon: '🏠', label: 'Home', active: false, route: '/home' },
              { icon: '🎮', label: 'Join', active: false, route: '' },
              { icon: '👤', label: 'Profile', active: false, route: '/profile' },
              { icon: '📊', label: 'Ranks', active: true, route: '/leaderboard' },
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
