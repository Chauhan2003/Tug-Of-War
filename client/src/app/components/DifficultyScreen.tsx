import { useNavigate } from 'react-router';

export type Difficulty = 'easy' | 'medium' | 'hard';

export default function DifficultyScreen() {
  const navigate = useNavigate();

  const difficulties = [
    {
      level: 'easy' as Difficulty,
      emoji: '😊',
      title: 'Easy',
      description: 'Numbers 1-10',
      color: 'from-green-400 to-green-600',
      hoverColor: 'hover:from-green-500 hover:to-green-700',
    },
    {
      level: 'medium' as Difficulty,
      emoji: '😎',
      title: 'Medium',
      description: 'Numbers 1-20',
      color: 'from-yellow-400 to-orange-500',
      hoverColor: 'hover:from-yellow-500 hover:to-orange-600',
    },
    {
      level: 'hard' as Difficulty,
      emoji: '🔥',
      title: 'Hard',
      description: 'Numbers 1-50',
      color: 'from-red-500 to-pink-600',
      hoverColor: 'hover:from-red-600 hover:to-pink-700',
    },
  ];

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-sky-400 via-purple-400 to-pink-400 p-4">
      <div className="w-full max-w-md h-full max-h-[800px] bg-white/95 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 p-6 text-white relative overflow-hidden">
          <button
            onClick={() => navigate('/')}
            className="absolute left-4 top-6 text-2xl hover:scale-110 transition-transform"
          >
            ←
          </button>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-4 text-4xl">⭐</div>
            <div className="absolute bottom-2 left-12 text-3xl">✨</div>
          </div>
          <h1 className="text-center text-3xl relative z-10">Choose Difficulty</h1>
          <p className="text-center text-sm mt-2 opacity-90">Pick your challenge level!</p>
        </div>

        {/* Difficulty Options */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-6xl animate-bounce mb-4">🎯</div>

          {difficulties.map((diff) => (
            <button
              key={diff.level}
              onClick={() => navigate(`/game?difficulty=${diff.level}`)}
              className={`w-full bg-gradient-to-r ${diff.color} ${diff.hoverColor} text-white p-8 rounded-3xl shadow-xl transform hover:scale-105 active:scale-95 transition-all border-4 border-white`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-3xl mb-2">{diff.title}</div>
                  <div className="text-sm opacity-90">{diff.description}</div>
                </div>
                <div className="text-6xl">{diff.emoji}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 p-4 text-white text-center">
          <div className="flex justify-center space-x-4 text-xl">
            <span className="animate-pulse">🌟</span>
            <span>Choose Wisely!</span>
            <span className="animate-pulse">🌟</span>
          </div>
        </div>
      </div>
    </div>
  );
}
