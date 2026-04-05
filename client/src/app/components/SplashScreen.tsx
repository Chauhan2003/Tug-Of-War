import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const timer = setTimeout(() => {
      navigate('/auth');
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 sm:p-8 relative overflow-hidden select-none">
      {/* Decorative floating elements */}
      <div className="absolute top-[8%] left-[8%] text-4xl sm:text-6xl animate-float opacity-40 pointer-events-none">⭐</div>
      <div className="absolute bottom-[15%] right-[8%] text-4xl sm:text-6xl animate-spin-slow opacity-40 pointer-events-none">✨</div>
      <div className="absolute top-[18%] right-[12%] text-3xl sm:text-5xl animate-float opacity-40 pointer-events-none" style={{ animationDelay: '1s' }}>🎨</div>
      <div className="absolute bottom-[30%] left-[6%] text-3xl sm:text-5xl animate-float opacity-40 pointer-events-none" style={{ animationDelay: '0.5s' }}>🏆</div>
      <div className="absolute top-[45%] right-[5%] text-2xl sm:text-4xl animate-spin-slow opacity-30 pointer-events-none" style={{ animationDelay: '1.5s' }}>🎯</div>
      <div className="absolute bottom-[8%] left-[40%] text-2xl sm:text-4xl animate-float opacity-30 pointer-events-none" style={{ animationDelay: '2s' }}>🔢</div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 0.8 }}
        className="mb-6 sm:mb-8"
      >
        <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/30">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl leading-none">🪢</div>
            <div className="text-2xl sm:text-3xl mt-1">➕✖️</div>
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-4xl sm:text-5xl md:text-6xl text-white text-center mb-3 drop-shadow-lg font-extrabold tracking-tight"
      >
        Math Tug of War
      </motion.h1>

      {/* Tagline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex items-center gap-3 sm:gap-4 text-white text-xl sm:text-2xl mb-10 sm:mb-14 font-semibold"
      >
        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1.5 rounded-full">Play</span>
        <span className="text-2xl sm:text-3xl opacity-60">•</span>
        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1.5 rounded-full">Learn</span>
        <span className="text-2xl sm:text-3xl opacity-60">•</span>
        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1.5 rounded-full">Win</span>
      </motion.div>

      {/* Loading Progress Bar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '100%', opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="w-full max-w-[240px] sm:max-w-[280px]"
      >
        <div className="h-2.5 sm:h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(255,200,0,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/80 text-sm sm:text-base text-center mt-3 font-medium">Loading...</p>
      </motion.div>
    </div>
  );
}
