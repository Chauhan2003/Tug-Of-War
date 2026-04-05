import { useNavigate } from 'react-router';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-sky-400 via-purple-400 to-pink-400 p-4">
      <div className="w-full max-w-md h-full max-h-[800px] bg-white/95 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Floating Stars */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-8 text-4xl animate-bounce">⭐</div>
          <div className="absolute top-20 right-12 text-3xl animate-pulse">✨</div>
          <div className="absolute bottom-32 left-16 text-5xl animate-bounce delay-100">🌟</div>
          <div className="absolute bottom-48 right-8 text-4xl animate-pulse delay-200">💫</div>
          <div className="absolute top-40 left-1/2 text-3xl animate-bounce delay-300">⚡</div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 relative z-10">
          {/* Logo/Title Area */}
          <div className="text-center space-y-4">
            <div className="text-8xl animate-bounce mb-4">🎮</div>
            <h1 className="text-5xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Math Tug of War
            </h1>
            <p className="text-xl text-gray-600">
              Pull the rope by solving math problems!
            </p>
          </div>

          {/* Characters Preview */}
          <div className="flex items-center justify-center space-x-8 my-8">
            <div className="text-center">
              <div className="text-6xl mb-2 animate-pulse">👦</div>
              <div className="text-sm text-gray-600">You</div>
            </div>
            <div className="text-4xl text-gray-400">VS</div>
            <div className="text-center">
              <div className="text-6xl mb-2 animate-pulse delay-200">🤖</div>
              <div className="text-sm text-gray-600">Robot</div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={() => navigate('/difficulty')}
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 hover:from-green-500 hover:via-blue-600 hover:to-purple-600 text-white text-3xl px-16 py-6 rounded-3xl shadow-2xl transform hover:scale-105 active:scale-95 transition-all border-4 border-white animate-pulse"
          >
            Start Game! 🚀
          </button>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="text-4xl mb-2">🧮</div>
              <div className="text-xs text-gray-600">Learn Math</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-xs text-gray-600">Win Prizes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🎨</div>
              <div className="text-xs text-gray-600">Have Fun</div>
            </div>
          </div>
        </div>

        {/* Footer Wave */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white text-center">
          <div className="flex justify-center space-x-3 text-2xl">
            <span className="animate-bounce">🌈</span>
            <span>Let's Learn Together!</span>
            <span className="animate-bounce delay-100">🎈</span>
          </div>
        </div>
      </div>
    </div>
  );
}
