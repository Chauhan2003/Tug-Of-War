import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { apiSubmitResult, apiGetQuestion } from '../../lib/api';

interface Question {
  num1: number;
  num2: number;
  answer: number;
  operation: string;
}

export default function GameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameState = (location.state as any) || {};
  const classId = gameState.classId;
  const levelId = gameState.levelId;

  const [timeLeft, setTimeLeft] = useState(60);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(10);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [ropePosition, setRopePosition] = useState(50);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({ num1: 0, num2: 0, answer: 0, operation: '+' });
  const [userAnswer, setUserAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [pulling, setPulling] = useState<'left' | 'right' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);

  const generateQuestion = useCallback(() => {
    apiGetQuestion(classId, levelId)
      .then((q: any) => {
        setCurrentQuestion({ num1: q.num1, num2: q.num2, answer: q.answer, operation: q.operation });
        setUserAnswer('');
        setFeedback(null);
      })
      .catch(() => {
        // Fallback to local generation if API fails
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operations = ['+', '-'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const answer = operation === '+' ? num1 + num2 : num1 - num2;
        setCurrentQuestion({ num1, num2, answer, operation });
        setUserAnswer('');
        setFeedback(null);
      });
  }, [classId, levelId]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  // Check win/lose on rope position change
  useEffect(() => {
    if (gameOver) return;
    if (ropePosition <= 15) {
      gameOverRef.current = true;
      setGameOver(true);
    } else if (ropePosition >= 85) {
      gameOverRef.current = true;
      setGameOver(true);
    }
  }, [ropePosition, gameOver]);

  // Submit result to backend & navigate on game over
  useEffect(() => {
    if (!gameOver) return;
    const playerWon = ropePosition <= 50;
    const accuracy = totalQuestions > 0 ? Math.round((score.player1 / totalQuestions) * 100) : 0;
    const duration = 60 - timeLeft;

    // Submit to backend (fire-and-forget, don't block navigation)
    apiSubmitResult({
      mode: 'single',
      classId,
      levelId,
      playerScore: score.player1,
      opponentScore: score.player2,
      totalQuestions,
      streak,
      accuracy,
      duration,
      won: playerWon,
    }).catch(() => {});

    const timer = setTimeout(() => {
      navigate('/result', { state: { score, streak, totalQuestions, playerWon } });
    }, 1200);
    return () => clearTimeout(timer);
  }, [gameOver, ropePosition, navigate, score, streak, totalQuestions, timeLeft]);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;
    if (timeLeft > 0 && questionNumber <= totalQuestions) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 || questionNumber > totalQuestions) {
      gameOverRef.current = true;
      setGameOver(true);
    }
  }, [timeLeft, questionNumber, totalQuestions, gameOver]);

  const handleSubmit = () => {
    if (!userAnswer || feedback || gameOver) return;
    const correct = parseInt(userAnswer) === currentQuestion.answer;

    if (correct) {
      setFeedback('correct');
      setPulling('left');
      setScore((prev) => ({ ...prev, player1: prev.player1 + 1 }));
      setRopePosition((prev) => Math.max(10, prev - 6));
      setStreak((prev) => prev + 1);
    } else {
      setFeedback('wrong');
      setPulling('right');
      setScore((prev) => ({ ...prev, player2: prev.player2 + 1 }));
      setRopePosition((prev) => Math.min(90, prev + 6));
      setStreak(0);
    }
    setTimeout(() => setPulling(null), 600);

    setTimeout(() => {
      if (gameOverRef.current) return;
      if (questionNumber < totalQuestions) {
        setQuestionNumber((prev) => prev + 1);
        generateQuestion();
      } else {
        gameOverRef.current = true;
        setGameOver(true);
      }
    }, 800);
  };

  const handleNumberClick = (num: string) => {
    if (feedback || gameOver) return;
    if (userAnswer.length >= 3) return;
    setUserAnswer((prev) => prev + num);
  };

  const handleNegative = () => {
    if (feedback || gameOver) return;
    setUserAnswer((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  const handleClear = () => {
    if (feedback || gameOver) return;
    setUserAnswer('');
  };

  const playerEmoji = ropePosition < 30 ? '😄' : ropePosition < 45 ? '😊' : ropePosition < 60 ? '😐' : ropePosition < 75 ? '😰' : '😱';
  const robotEmoji = ropePosition > 70 ? '😄' : ropePosition > 55 ? '😊' : ropePosition > 40 ? '😐' : ropePosition > 25 ? '😰' : '😱';
  const timerPercent = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 30 ? 'from-green-400 to-emerald-500' : timeLeft > 10 ? 'from-yellow-400 to-orange-500' : 'from-red-400 to-red-600';

  // How far each character leans when pulling
  const playerLean = pulling === 'left' ? -18 : pulling === 'right' ? 5 : -5;
  const robotLean = pulling === 'right' ? 18 : pulling === 'left' ? -5 : 5;

  // Losing side gets pulled toward center. Winning side stays at edge.
  // ropePosition: 10(player winning) ↔ 50(center) ↔ 90(robot winning)
  // Player: normally at 4%. When losing (rope>50), gets pulled right toward center.
  const playerX = ropePosition <= 50 ? 4 : 4 + (ropePosition - 50) * 0.8;   // 4% → ~36%
  // Robot: normally at 4% from right. When losing (rope<50), gets pulled left toward center.
  const robotX = ropePosition >= 50 ? 4 : 4 + (50 - ropePosition) * 0.8;    // 4% → ~36%
  // Knot position on the rope between the two characters
  const knotPercent = ropePosition;

  return (
    <div className="size-full bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Header - Score & Timer */}
        <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-xl shrink-0">
          <div className="flex items-center justify-between mb-2">
            {/* Player 1 */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0">
                {playerEmoji}
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">You</p>
                <p className="text-xl sm:text-2xl text-gray-800 font-bold leading-none">{score.player1}</p>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className={`bg-gradient-to-r ${timerColor} text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-base sm:text-lg font-bold shadow-lg ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                ⏱️ {timeLeft}s
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-medium">Q {questionNumber}/{totalQuestions}</p>
              {streak > 1 && (
                <p className="text-[10px] sm:text-xs text-orange-500 font-bold">🔥 {streak} Streak!</p>
              )}
            </div>

            {/* Player 2 */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Robot</p>
                <p className="text-xl sm:text-2xl text-gray-800 font-bold leading-none">{score.player2}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0">
                {robotEmoji}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Tug of War Scene */}
        <div className="shrink-0 relative overflow-hidden" style={{ height: 'clamp(110px, 22vh, 150px)' }}>
          {/* Sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-green-200" />
          {/* Clouds */}
          <div className="absolute top-1 left-[12%] text-white/40 text-base animate-float" style={{ animationDuration: '4s' }}>☁️</div>
          <div className="absolute top-2 right-[18%] text-white/30 text-xs animate-float" style={{ animationDuration: '5s', animationDelay: '1s' }}>☁️</div>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-[32%] bg-gradient-to-t from-green-700 via-green-600 to-green-500" />
          {/* Mud pit center */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[12%] h-[24%] bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-full opacity-70" />

          {/* Center line marker (fixed) */}
          <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 w-0.5 h-[30%] bg-red-500/50 z-30" />
          <div className="absolute bottom-[60%] left-1/2 -translate-x-1/2 z-30 text-[8px] text-red-600 font-bold">▼</div>

          {/* WIN / LOSE labels */}
          <div className="absolute top-1.5 left-2 text-[9px] sm:text-[10px] font-bold text-green-800 bg-green-300/60 px-1.5 py-0.5 rounded-full z-30">🏆 WIN</div>
          <div className="absolute top-1.5 right-2 text-[9px] sm:text-[10px] font-bold text-red-800 bg-red-300/60 px-1.5 py-0.5 rounded-full z-30">LOSE 💀</div>

          {/* === PLAYER (left side) — stays at edge when winning, pulled right when losing === */}
          <motion.div
            className="absolute bottom-[30%] z-20 origin-bottom"
            animate={{ left: `${playerX}%`, rotate: playerLean }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <div className="flex flex-col items-center">
              <div className="text-2xl sm:text-3xl">{playerEmoji}</div>
              <div className="w-5 h-4 sm:w-6 sm:h-5 bg-gradient-to-b from-blue-500 to-blue-700 rounded-b-md mx-auto -mt-1" />
              <div className="flex gap-0.5">
                <div className="w-1.5 h-3 bg-gray-700 rounded-b-sm" />
                <div className="w-1.5 h-3 bg-gray-700 rounded-b-sm" />
              </div>
            </div>
            {pulling === 'left' && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -12 }}
                transition={{ duration: 0.5 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs"
              >
                💪
              </motion.div>
            )}
          </motion.div>

          {/* === ROPE — stretches between the two characters === */}
          <motion.div
            className="absolute bottom-[44%] z-10"
            animate={{ left: `${playerX + 6}%`, right: `${robotX + 6}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <div className="relative h-2.5 sm:h-3 w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 rounded-full shadow-md" />
              <div className="absolute inset-0 rounded-full opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(0,0,0,0.2) 6px, rgba(0,0,0,0.2) 8px)' }} />
              <div className="absolute top-0 left-0 right-0 h-[35%] bg-white/15 rounded-full" />
              {/* Knot/Flag — positioned by ropePosition mapped into the rope's own width */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                animate={{ left: `${knotPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-red-700" />
                <div className="absolute -top-5 left-1/2 w-3 h-2 bg-red-500" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
                <motion.div
                  animate={{ scale: pulling ? [1, 1.25, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg border-2 border-yellow-300"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* === ROBOT (right side) — stays at edge when winning, pulled left when losing === */}
          <motion.div
            className="absolute bottom-[30%] z-20 origin-bottom"
            animate={{ right: `${robotX}%`, rotate: robotLean }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <div className="flex flex-col items-center">
              <div className="text-2xl sm:text-3xl">{robotEmoji}</div>
              <div className="w-5 h-4 sm:w-6 sm:h-5 bg-gradient-to-b from-red-500 to-red-700 rounded-b-md mx-auto -mt-1" />
              <div className="flex gap-0.5">
                <div className="w-1.5 h-3 bg-gray-700 rounded-b-sm" />
                <div className="w-1.5 h-3 bg-gray-700 rounded-b-sm" />
              </div>
            </div>
            {pulling === 'right' && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -12 }}
                transition={{ duration: 0.5 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs"
              >
                😤
              </motion.div>
            )}
          </motion.div>

          {/* Timer bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-black/20 z-30">
            <div
              className={`h-full bg-gradient-to-r ${timerColor} transition-all duration-1000 ease-linear`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center mx-4"
            >
              <div className="text-5xl sm:text-6xl mb-2">{ropePosition <= 50 ? '🏆' : '😢'}</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-1 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {ropePosition <= 50 ? 'You Win!' : 'You Lose!'}
              </h2>
              <p className="text-sm text-gray-500">Loading results...</p>
            </motion.div>
          </motion.div>
        )}

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-3 sm:p-4">
          <div className="w-full space-y-2.5 sm:space-y-3">
            {/* Question Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={questionNumber}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-6 shadow-xl text-center"
              >
                <p className="text-xs sm:text-sm text-gray-400 mb-2 font-medium">Solve this:</p>
                <div className="text-4xl sm:text-5xl md:text-6xl text-gray-800 font-extrabold mb-3 sm:mb-4">
                  {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?
                </div>

                {/* Answer Display */}
                <div className={`rounded-2xl p-3 sm:p-4 min-h-[56px] sm:min-h-[68px] flex items-center justify-center border-3 transition-all duration-200 ${
                  feedback === 'correct' ? 'border-green-500 bg-green-50' :
                  feedback === 'wrong' ? 'border-red-500 bg-red-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  {feedback ? (
                    <div className="text-center">
                      <div className={`text-4xl sm:text-5xl mb-1 ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                        {feedback === 'correct' ? '✓' : '✗'}
                      </div>
                      <p className="text-sm sm:text-base font-bold">
                        {feedback === 'correct' ? 'Correct! 🎉' : `Answer: ${currentQuestion.answer}`}
                      </p>
                    </div>
                  ) : (
                    <span className="text-3xl sm:text-4xl text-gray-800 font-bold">{userAnswer || <span className="text-gray-300 text-lg">Type your answer</span>}</span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Number Pad */}
            {!feedback && (
              <div className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-3 sm:p-4 shadow-xl">
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-2 sm:mb-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num.toString())}
                      className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl sm:text-3xl py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold"
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  <button
                    onClick={handleNegative}
                    className="bg-gradient-to-br from-gray-400 to-gray-500 text-white text-xl sm:text-2xl py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold"
                  >
                    ±
                  </button>
                  <button
                    onClick={() => handleNumberClick('0')}
                    className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl sm:text-3xl py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold"
                  >
                    0
                  </button>
                  <button
                    onClick={handleClear}
                    className="bg-gradient-to-br from-red-400 to-pink-500 text-white text-base sm:text-lg py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold"
                  >
                    ⌫
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!userAnswer}
                    className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-base sm:text-lg py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
