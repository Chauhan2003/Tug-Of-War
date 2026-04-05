import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { apiGetLevels } from '../../lib/api';

const classEmojis: Record<string, string> = { '1': '🌱', '2': '🌿', '3': '🌳', '4': '🎯', '5': '🏆' };
const levelColors = [
  'from-green-400 to-emerald-500',
  'from-blue-400 to-cyan-500',
  'from-purple-400 to-violet-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-amber-500',
];

export default function LevelSelection() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    apiGetLevels(parseInt(classId))
      .then((data) => {
        setLevels(data.map((l: any, i: number) => ({
          id: l.id,
          level_number: l.level_number,
          stars: l.stars,
          color: levelColors[i % levelColors.length],
          unlocked: l.unlocked,
          completed: l.completed > 0,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classId]);

  const completedCount = levels.filter((l) => l.completed).length;

  return (
    <div className="size-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Header Card — pinned */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/95 backdrop-blur-md rounded-b-[1.25rem] sm:rounded-b-[1.5rem] p-3.5 sm:p-4 shadow-xl shrink-0 mx-4 sm:mx-5 mt-3 sm:mt-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/class-selection')}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-base sm:text-lg shadow-lg active:scale-95 transition-transform shrink-0"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl text-gray-800 font-bold">Class {classId}</h1>
              <p className="text-[10px] sm:text-xs text-gray-500">Choose your level</p>
            </div>
            <div className="text-2xl sm:text-3xl shrink-0">{classEmojis[classId || '1'] || '📘'}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Progress</span>
              <span className="text-[10px] sm:text-xs text-gray-700 font-bold">{completedCount} / {levels.length}</span>
            </div>
            <div className="h-2 sm:h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / levels.length) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Scrollable Level Cards */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-5 py-3 space-y-3">
          {levels.map((level, index) => (
            <motion.button
              key={level.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.07 * index, type: 'spring', stiffness: 300, damping: 24 }}
              onClick={() => level.unlocked && navigate('/mode-selection')}
              disabled={!level.unlocked}
              className={`w-full bg-gradient-to-r ${level.color} rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-xl transform transition-all duration-200 relative ${
                level.unlocked
                  ? 'hover:scale-[1.03] active:scale-[0.97] hover:shadow-2xl'
                  : 'opacity-45 grayscale cursor-not-allowed'
              }`}
            >
              {level.completed && (
                <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg text-sm sm:text-base">
                  ✅
                </div>
              )}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl font-extrabold shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <h3 className="text-base sm:text-lg font-bold mb-0.5">Level {level.id}</h3>
                    <div className="flex gap-0.5 mb-0.5">
                      {[1, 2, 3].map((s) => (
                        <span key={s} className={`text-sm sm:text-base ${s <= level.stars ? '' : 'opacity-30'}`}>⭐</span>
                      ))}
                    </div>
                    <p className="text-[10px] sm:text-xs opacity-90 font-medium">
                      {level.unlocked ? (level.completed ? 'Completed!' : 'Ready to play') : 'Locked'}
                    </p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl shrink-0 ml-2">
                  {level.unlocked ? '▶️' : '🔒'}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
