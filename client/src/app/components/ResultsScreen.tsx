import { useNavigate, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';

export default function ResultsScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const playerScore = parseInt(searchParams.get('player') || '0');
  const robotScore = parseInt(searchParams.get('robot') || '0');
  const streak = parseInt(searchParams.get('streak') || '0');
  const difficulty = searchParams.get('difficulty') || 'easy';

  const [showConfetti, setShowConfetti] = useState(false);
  const won = playerScore > robotScore;
  const tied = playerScore === robotScore;
  const totalQuestions = playerScore + robotScore;
  const accuracy = totalQuestions > 0 ? Math.round((playerScore / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (won) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [won]);

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { text: "Outstanding!", emoji: "🌟", color: "text-yellow-500" };
    if (accuracy >= 75) return { text: "Great Job!", emoji: "🎉", color: "text-green-500" };
    if (accuracy >= 50) return { text: "Good Effort!", emoji: "👍", color: "text-blue-500" };
    return { text: "Keep Practicing!", emoji: "💪", color: "text-purple-500" };
  };

  const performance = getPerformanceMessage();

  const stars = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : accuracy >= 30 ? 1 : 0;

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-sky-400 via-purple-400 to-pink-400 p-4 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '🎊', '⭐', '✨', '🏆'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-md h-full max-h-[800px] bg-white/95 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-4 text-5xl animate-spin-slow">⭐</div>
            <div className="absolute bottom-2 right-4 text-5xl animate-spin-slow">✨</div>
          </div>
          <h1 className="text-4xl relative z-10">Game Over!</h1>
        </div>

        {/* Results Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 overflow-y-auto">
          {/* Main Result */}
          <div className="text-center">
            <div className="text-9xl animate-bounce mb-4">
              {won ? '🏆' : tied ? '🤝' : '😊'}
            </div>
            <h2 className="text-4xl mb-2">
              {won ? 'You Win!' : tied ? "It's a Tie!" : 'Good Try!'}
            </h2>
            <p className={`text-2xl ${performance.color}`}>
              {performance.emoji} {performance.text}
            </p>
          </div>

          {/* Score Display */}
          <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl p-6 shadow-lg">
            <div className="flex justify-around items-center mb-4">
              <div className="text-center">
                <div className="text-5xl mb-2">👦</div>
                <div className="text-3xl text-blue-600">{playerScore}</div>
                <div className="text-sm text-gray-600">Your Score</div>
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className="text-5xl mb-2">🤖</div>
                <div className="text-3xl text-purple-600">{robotScore}</div>
                <div className="text-sm text-gray-600">Robot Score</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="w-full space-y-3">
            <div className="bg-yellow-100 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-lg">🎯 Accuracy</span>
              <span className="text-2xl">{accuracy}%</span>
            </div>
            <div className="bg-orange-100 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-lg">🔥 Best Streak</span>
              <span className="text-2xl">{streak}</span>
            </div>
            <div className="bg-pink-100 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-lg">📊 Difficulty</span>
              <span className="text-2xl capitalize">{difficulty}</span>
            </div>
          </div>

          {/* Stars Earned */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Stars Earned</div>
            <div className="flex justify-center space-x-2 text-5xl">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={i < stars ? 'animate-bounce' : 'opacity-30'}>
                  {i < stars ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={() => navigate(`/game?difficulty=${difficulty}`)}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-2xl px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 active:scale-95 transition-all"
            >
              Play Again 🔄
            </button>
            <button
              onClick={() => navigate('/difficulty')}
              className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white text-2xl px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 active:scale-95 transition-all"
            >
              Change Difficulty 🎯
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white text-xl px-8 py-3 rounded-2xl shadow-lg transform hover:scale-105 active:scale-95 transition-all"
            >
              Main Menu 🏠
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 p-4 text-white text-center">
          <div className="flex justify-center space-x-3 text-xl">
            <span className="animate-bounce">🌈</span>
            <span>Keep Learning & Growing!</span>
            <span className="animate-bounce delay-100">🚀</span>
          </div>
        </div>
      </div>
    </div>
  );
}
