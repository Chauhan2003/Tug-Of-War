import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { apiGetProfile, apiUpdateProfile } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import JoinRoomModal from './JoinRoomModal';

const achievementDefs = [
  { id: 1, name: 'First Win', emoji: '🏆', check: (s: any) => s.wins >= 1 },
  { id: 2, name: '10 Streak', emoji: '🔥', check: (s: any) => s.best_streak >= 10 },
  { id: 3, name: '100 Matches', emoji: '💯', check: (s: any) => s.matches_played >= 100 },
  { id: 4, name: 'Speed Master', emoji: '⚡', check: (s: any) => s.best_streak >= 5 },
  { id: 5, name: 'Perfect Score', emoji: '⭐', check: (s: any) => s.accuracy >= 90 },
  { id: 6, name: 'Math Legend', emoji: '👑', check: (s: any) => s.wins >= 50 },
];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    total_points: 0, matches_played: 0, wins: 0, losses: 0,
    accuracy: 0, best_streak: 0, level: 1, rank: 0,
    username: user?.username || 'Player', avatar: user?.avatar || '👦',
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const isGuest = user?.is_guest === 1 || user?.is_guest === true || (stats as any).is_guest === 1;

  useEffect(() => {
    apiGetProfile()
      .then((data) => {
        setStats(data);
        setEditUsername(data.username || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleEditProfile = () => {
    if (isGuest) {
      // Guest can't edit — redirect to auth
      navigate('/auth');
      return;
    }
    setEditMode(true);
    setShowSettings(false);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) return;
    setSaving(true);
    setEditError('');
    try {
      const updated = await apiUpdateProfile({ username: editUsername.trim() });
      setStats((prev: any) => ({ ...prev, username: updated.username }));
      setEditMode(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const achievements = achievementDefs.map((a) => ({ ...a, unlocked: a.check(stats) }));
  const winRate = stats.matches_played > 0 ? Math.round((stats.wins / stats.matches_played) * 100) : 0;

  return (
    <div className="size-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 px-4 sm:px-6 pt-3 sm:pt-4 pb-12 sm:pb-14 relative overflow-hidden shrink-0">
            {/* Decorative floating */}
            <div className="absolute top-[18%] left-[6%] text-2xl opacity-20 animate-float pointer-events-none">⭐</div>
            <div className="absolute top-[30%] right-[6%] text-2xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>✨</div>

            {/* Settings Button — top right */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-lg sm:text-xl shadow-lg hover:bg-white/30 active:scale-95 transition-all"
              >
                ⚙️
              </button>

              {/* Settings Dropdown */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-11 right-0 bg-white rounded-xl shadow-2xl overflow-hidden min-w-[160px] z-50"
                  >
                    <button
                      onClick={handleEditProfile}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <span className="text-base">{isGuest ? '🔒' : '✏️'}</span>
                      {isGuest ? 'Login / Sign Up' : 'Edit Profile'}
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                      <span className="text-base">🚪</span>
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar & Info */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-center text-white"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-2xl mb-2 border-[3px] border-white/80">
                {stats.avatar}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold mb-1.5 drop-shadow-md">{stats.username}</h1>
              <div className="flex items-center justify-center gap-2">
                {isGuest && (
                  <span className="bg-yellow-400/30 backdrop-blur-sm px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">Guest</span>
                )}
                <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">Level {stats.level}</span>
                <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">Rank #{stats.rank}</span>
              </div>
            </motion.div>
          </div>

          {/* Stats Cards — overlapping header */}
          <div className="px-4 sm:px-5 -mt-8 sm:-mt-10 space-y-3 pb-4">
            {/* Main Stats Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-2xl"
            >
              <h2 className="text-sm sm:text-base text-gray-800 font-bold mb-2.5 flex items-center gap-1.5">
                📊 Your Stats
              </h2>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[
                  { emoji: '⭐', value: stats.total_points.toLocaleString(), label: 'Points', bg: 'from-blue-50 to-blue-100' },
                  { emoji: '🎮', value: stats.matches_played, label: 'Matches', bg: 'from-purple-50 to-purple-100' },
                  { emoji: '🏆', value: stats.wins, label: 'Wins', bg: 'from-green-50 to-green-100' },
                  { emoji: '🔥', value: stats.best_streak, label: 'Streak', bg: 'from-orange-50 to-orange-100' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-center`}>
                    <div className="text-base sm:text-lg mb-0.5">{stat.emoji}</div>
                    <p className="text-sm sm:text-base text-gray-800 font-bold leading-tight">{stat.value}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Accuracy Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] sm:text-xs mb-1">
                  <span className="text-gray-500 font-medium">Accuracy</span>
                  <span className="text-gray-700 font-bold">{stats.accuracy}%</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.accuracy}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            {/* Win/Loss Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm sm:text-base text-gray-800 font-bold">Win Rate</h2>
                <span className="text-xs sm:text-sm font-bold text-green-600">{winRate}%</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex-1">
                  <div className="flex justify-between text-[9px] sm:text-[10px] mb-1 font-medium">
                    <span className="text-green-600">Wins: {stats.wins}</span>
                    <span className="text-red-500">Losses: {stats.losses}</span>
                  </div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 rounded-l-full"
                      style={{ width: `${winRate}%` }}
                    />
                    <div
                      className="bg-gradient-to-r from-red-400 to-red-500 rounded-r-full"
                      style={{ width: `${100 - winRate}%` }}
                    />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl shrink-0">
                  {stats.wins > stats.losses ? '😄' : '💪'}
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-xl"
            >
              <h2 className="text-sm sm:text-base text-gray-800 font-bold mb-2.5 flex items-center gap-1.5">
                🏅 Achievements
              </h2>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {achievements.map((achievement, i) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
                    className={`rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-center transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 shadow-sm'
                        : 'bg-gray-100 opacity-40 grayscale'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-0.5">{achievement.emoji}</div>
                    <p className="text-[9px] sm:text-[10px] text-gray-600 font-medium leading-tight">{achievement.name}</p>
                    {achievement.unlocked && (
                      <div className="text-[10px] sm:text-xs text-green-500 font-bold">✓</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {editMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setEditMode(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[1.5rem] p-5 sm:p-6 shadow-2xl w-full max-w-sm space-y-4"
              >
                <div className="text-center">
                  <div className="text-3xl mb-1">✏️</div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Edit Profile</h2>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-gray-500 font-medium mb-1 block">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base text-gray-800 font-medium focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>

                {editError && (
                  <p className="text-xs text-red-500 text-center font-medium">{editError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 active:scale-[0.97] transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !editUsername.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:shadow-lg active:scale-[0.97] transition-all disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close settings dropdown when clicking outside */}
        {showSettings && (
          <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)} />
        )}

        {/* Bottom Navigation — pinned, no animation */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 sm:py-3 rounded-t-[1.5rem] shadow-xl shrink-0">
          <div className="flex justify-around items-center max-w-xs mx-auto">
            {[
              { icon: '🏠', label: 'Home', active: false, route: '/home' },
              { icon: '🎮', label: 'Join', active: false, route: '' },
              { icon: '👤', label: 'Profile', active: true, route: '/profile' },
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
