import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { connectSocket } from '../../lib/socket';

interface Question {
  index: number;
  num1: number;
  num2: number;
  operation: string;
  total: number;
}

export default function MultiplayerGameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, opponent, myIndex, timeLimit, totalQuestions } = (location.state as any) || {};

  const [timeLeft, setTimeLeft] = useState(timeLimit || 60);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQ] = useState(totalQuestions || 10);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [ropePosition, setRopePosition] = useState(50);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [pulling, setPulling] = useState<'left' | 'right' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [opponentName] = useState(opponent?.username || 'Opponent');
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(10);
  const gameOverRef = useRef(false);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const socket = connectSocket();

  // Reset per-question countdown
  const startQuestionCountdown = useCallback(() => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setQuestionTimeLeft(10);
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          if (questionTimerRef.current) clearInterval(questionTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!roomCode) {
      navigate('/home');
      return;
    }

    // Listen for game events
    socket.on('next-question', (data: any) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.question.index + 1);
      setUserAnswer('');
      setFeedback(null);
      setWaitingForOpponent(false);
      startQuestionCountdown();
    });

    socket.on('game-update', (data: any) => {
      setRopePosition(data.ropePosition);

      // Determine scores using myPlayerId for reliable lookup
      const myId = (location.state as any)?.myPlayerId;
      const scoreEntries = Object.entries(data.scores);
      let myScore = 0, opScore = 0;
      for (const [pid, val] of scoreEntries) {
        if (pid === myId) myScore = val as number;
        else opScore = val as number;
      }
      setScore({ player1: myScore, player2: opScore });

      // Show pulling animation based on who acted
      if (data.lastAction) {
        const isMe = data.lastAction.playerId === (location.state as any)?.myPlayerId;
        if (data.lastAction.correct) {
          setPulling(isMe ? 'left' : 'right');
        } else {
          setPulling(isMe ? 'right' : 'left');
        }
        setTimeout(() => setPulling(null), 600);
      }
    });

    socket.on('question-timeout', () => {
      setFeedback(null);
      setWaitingForOpponent(false);
    });

    socket.on('game-over', (data: any) => {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      setGameOver(true);
      setWinner(data.winner);
      setRopePosition(data.ropePosition);

      if (questionTimerRef.current) clearInterval(questionTimerRef.current);

      // Navigate to result after a delay
      const myPlayerId = (location.state as any)?.myPlayerId;
      const playerWon = data.winner === myPlayerId;
      setTimeout(() => {
        navigate('/result', {
          state: {
            score,
            streak,
            totalQuestions: totalQ,
            playerWon,
            multiplayer: true,
            opponentName,
          },
        });
      }, 2000);
    });

    socket.on('player-left', () => {
      if (!gameOverRef.current) {
        gameOverRef.current = true;
        setGameOver(true);
        setTimeout(() => {
          navigate('/result', {
            state: {
              score,
              streak,
              totalQuestions: totalQ,
              playerWon: true,
              multiplayer: true,
              opponentName,
              reason: 'Opponent disconnected',
            },
          });
        }, 1500);
      }
    });

    socket.on('timer-tick', (data: any) => {
      setTimeLeft(data.timeLeft);
    });

    return () => {
      socket.off('next-question');
      socket.off('game-update');
      socket.off('question-timeout');
      socket.off('game-over');
      socket.off('player-left');
      socket.off('timer-tick');
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [roomCode, navigate, socket, myIndex, startQuestionCountdown]);

  // Set initial question from location state
  useEffect(() => {
    const state = location.state as any;
    if (state?.firstQuestion) {
      setCurrentQuestion(state.firstQuestion);
      startQuestionCountdown();
    }
  }, [location.state, startQuestionCountdown]);

  const handleSubmit = useCallback(() => {
    if (!userAnswer || feedback || gameOver || !currentQuestion || waitingForOpponent) return;

    const answerNum = parseInt(userAnswer);
    if (isNaN(answerNum)) return;

    socket.emit('submit-answer', { roomCode, answer: answerNum }, (response: any) => {
      if (!response.success) return;

      if (response.correct) {
        setFeedback('correct');
        setStreak((prev) => prev + 1);
      } else {
        setFeedback('wrong');
        setStreak(0);
      }

      // Show waiting state until both answer
      setWaitingForOpponent(true);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    });
  }, [userAnswer, feedback, gameOver, currentQuestion, waitingForOpponent, roomCode, socket]);

  const handleNumberClick = (num: string) => {
    if (feedback || gameOver || waitingForOpponent) return;
    if (userAnswer.length >= 3) return;
    setUserAnswer((prev) => prev + num);
  };

  const handleNegative = () => {
    if (feedback || gameOver || waitingForOpponent) return;
    setUserAnswer((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  const handleClear = () => {
    if (feedback || gameOver || waitingForOpponent) return;
    setUserAnswer('');
  };

  // Rope position: for player index 0, low = winning. For index 1, high = winning.
  // We flip the display so "left = me" always
  const displayRope = myIndex === 0 ? ropePosition : 100 - ropePosition;

  const playerEmoji = displayRope < 30 ? '😄' : displayRope < 45 ? '😊' : displayRope < 60 ? '😐' : displayRope < 75 ? '😰' : '😱';
  const opponentEmoji = displayRope > 70 ? '😄' : displayRope > 55 ? '😊' : displayRope > 40 ? '😐' : displayRope > 25 ? '😰' : '😱';
  const timerPercent = (timeLeft / (timeLimit || 60)) * 100;
  const timerColor = timeLeft > 30 ? 'from-green-400 to-emerald-500' : timeLeft > 10 ? 'from-yellow-400 to-orange-500' : 'from-red-400 to-red-600';

  const playerLean = pulling === 'left' ? -18 : pulling === 'right' ? 5 : -5;
  const opponentLean = pulling === 'right' ? 18 : pulling === 'left' ? -5 : 5;
  const playerX = displayRope <= 50 ? 4 : 4 + (displayRope - 50) * 0.8;
  const opponentX = displayRope >= 50 ? 4 : 4 + (50 - displayRope) * 0.8;
  const knotPercent = displayRope;

  return (
    <div className="size-full bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Header - Score & Timer */}
        <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-xl shrink-0">
          <div className="flex items-center justify-between mb-2">
            {/* Me */}
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
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-medium">Q {questionNumber}/{totalQ}</p>
              {streak > 1 && (
                <p className="text-[10px] sm:text-xs text-orange-500 font-bold">🔥 {streak} Streak!</p>
              )}
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate max-w-[60px]">{opponentName}</p>
                <p className="text-xl sm:text-2xl text-gray-800 font-bold leading-none">{score.player2}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0">
                {opponentEmoji}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${(questionNumber / totalQ) * 100}%` }}
            />
          </div>
        </div>

        {/* Tug of War Scene */}
        <div className="shrink-0 relative overflow-hidden" style={{ height: 'clamp(110px, 22vh, 150px)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-green-200" />
          <div className="absolute top-1 left-[12%] text-white/40 text-base animate-float" style={{ animationDuration: '4s' }}>☁️</div>
          <div className="absolute top-2 right-[18%] text-white/30 text-xs animate-float" style={{ animationDuration: '5s', animationDelay: '1s' }}>☁️</div>

          <div className="absolute bottom-0 left-0 right-0 h-[32%] bg-gradient-to-t from-green-700 via-green-600 to-green-500" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[12%] h-[24%] bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-full opacity-70" />

          <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 w-0.5 h-[30%] bg-red-500/50 z-30" />
          <div className="absolute bottom-[60%] left-1/2 -translate-x-1/2 z-30 text-[8px] text-red-600 font-bold">▼</div>

          <div className="absolute top-1.5 left-2 text-[9px] sm:text-[10px] font-bold text-green-800 bg-green-300/60 px-1.5 py-0.5 rounded-full z-30">🏆 WIN</div>
          <div className="absolute top-1.5 right-2 text-[9px] sm:text-[10px] font-bold text-red-800 bg-red-300/60 px-1.5 py-0.5 rounded-full z-30">LOSE 💀</div>

          {/* Player (left) */}
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
              <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: -12 }} transition={{ duration: 0.5 }} className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">💪</motion.div>
            )}
          </motion.div>

          {/* Rope */}
          <motion.div
            className="absolute bottom-[44%] z-10"
            animate={{ left: `${playerX + 6}%`, right: `${opponentX + 6}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <div className="relative h-2.5 sm:h-3 w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 rounded-full shadow-md" />
              <div className="absolute inset-0 rounded-full opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(0,0,0,0.2) 6px, rgba(0,0,0,0.2) 8px)' }} />
              <div className="absolute top-0 left-0 right-0 h-[35%] bg-white/15 rounded-full" />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                animate={{ left: `${knotPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-red-700" />
                <div className="absolute -top-5 left-1/2 w-3 h-2 bg-red-500" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
                <motion.div animate={{ scale: pulling ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }} className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg border-2 border-yellow-300" />
              </motion.div>
            </div>
          </motion.div>

          {/* Opponent (right) */}
          <motion.div
            className="absolute bottom-[30%] z-20 origin-bottom"
            animate={{ right: `${opponentX}%`, rotate: opponentLean }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <div className="flex flex-col items-center">
              <div className="text-2xl sm:text-3xl">{opponentEmoji}</div>
              <div className="w-5 h-4 sm:w-6 sm:h-5 bg-gradient-to-b from-red-500 to-red-700 rounded-b-md mx-auto -mt-1" />
              <div className="flex gap-0.5">
                <div className="w-1.5 h-3 bg-gray-700 rounded-b-sm" />
                <div className="w-1.5 h-3 bg-gray-700 rounded-b-sm" />
              </div>
            </div>
            {pulling === 'right' && (
              <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: -12 }} transition={{ duration: 0.5 }} className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">😤</motion.div>
            )}
          </motion.div>

          {/* Timer bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-black/20 z-30">
            <div className={`h-full bg-gradient-to-r ${timerColor} transition-all duration-1000 ease-linear`} style={{ width: `${timerPercent}%` }} />
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
              <div className="text-5xl sm:text-6xl mb-2">
                {winner === (location.state as any)?.myPlayerId ? '🏆' : winner === null ? '🤝' : '😢'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-1 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {winner === (location.state as any)?.myPlayerId ? 'You Win!' : winner === null ? 'Draw!' : 'You Lose!'}
              </h2>
              <p className="text-sm text-gray-500">Loading results...</p>
            </motion.div>
          </motion.div>
        )}

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-3 sm:p-4">
          <div className="w-full space-y-2.5 sm:space-y-3">
            {currentQuestion ? (
              <>
                {/* Per-question timer */}
                {!feedback && !waitingForOpponent && (
                  <div className="flex justify-center">
                    <div className={`text-xs font-bold px-3 py-1 rounded-full ${questionTimeLeft <= 3 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white/80 text-gray-600'}`}>
                      ⏰ {questionTimeLeft}s left for this question
                    </div>
                  </div>
                )}

                {/* Question Display */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.index}
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
                      waitingForOpponent ? 'border-yellow-400 bg-yellow-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      {waitingForOpponent ? (
                        <div className="text-center">
                          <div className="text-2xl mb-1">{feedback === 'correct' ? '✅' : '❌'}</div>
                          <p className="text-xs sm:text-sm font-medium text-yellow-600 animate-pulse">Waiting for opponent...</p>
                        </div>
                      ) : feedback ? (
                        <div className="text-center">
                          <div className={`text-4xl sm:text-5xl mb-1 ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                            {feedback === 'correct' ? '✓' : '✗'}
                          </div>
                          <p className="text-sm sm:text-base font-bold">
                            {feedback === 'correct' ? 'Correct! 🎉' : 'Wrong!'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-3xl sm:text-4xl text-gray-800 font-bold">{userAnswer || '—'}</span>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Number Pad */}
                {!feedback && !waitingForOpponent && (
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
                      <button onClick={handleNegative} className="bg-gradient-to-br from-gray-400 to-gray-500 text-white text-xl sm:text-2xl py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold">±</button>
                      <button onClick={() => handleNumberClick('0')} className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl sm:text-3xl py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold">0</button>
                      <button onClick={handleClear} className="bg-gradient-to-br from-red-400 to-pink-500 text-white text-base sm:text-lg py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md active:scale-90 transform transition-all duration-100 font-bold">⌫</button>
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
              </>
            ) : (
              <div className="text-center text-white">
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p className="text-lg font-bold">Loading question...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
