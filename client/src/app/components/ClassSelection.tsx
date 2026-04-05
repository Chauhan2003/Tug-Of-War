import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { apiGetClasses } from '../../lib/api';

export default function ClassSelection() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetClasses()
      .then((data) => {
        setClasses(data.map((c: any) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          color: c.color,
          unlocked: c.unlocked,
          desc: c.description,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const unlockedCount = classes.filter((c) => c.unlocked).length;

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
            onClick={() => navigate('/home')}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-lg sm:text-xl shadow-lg active:scale-95 transition-transform shrink-0"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl text-white font-bold drop-shadow-md">Select Class</h1>
        </motion.div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-5 pb-4 space-y-3">
          {/* Class Cards */}
          {classes.map((classItem, index) => (
            <motion.button
              key={classItem.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.08 * index, type: 'spring', stiffness: 300, damping: 24 }}
              onClick={() => classItem.unlocked && navigate(`/level-selection/${classItem.id}`)}
              disabled={!classItem.unlocked}
              className={`w-full bg-gradient-to-r ${classItem.color} rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-xl transform transition-all duration-200 ${
                classItem.unlocked
                  ? 'hover:scale-[1.03] active:scale-[0.97] hover:shadow-2xl'
                  : 'opacity-50 grayscale cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                    {classItem.emoji}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl font-bold mb-0.5">{classItem.name}</h3>
                    <p className="text-xs sm:text-sm opacity-90">
                      {classItem.unlocked ? classItem.desc : 'Complete previous class'}
                    </p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl shrink-0 ml-2">
                  {classItem.unlocked ? '▶️' : '🔒'}
                </div>
              </div>
            </motion.button>
          ))}

          {/* Progress Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Overall Progress</p>
                <p className="text-base sm:text-lg text-gray-800 font-bold">{unlockedCount} / {classes.length} Classes</p>
              </div>
              <div className="text-2xl sm:text-3xl">📚</div>
            </div>
            <div className="h-2 sm:h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / classes.length) * 100}%` }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
