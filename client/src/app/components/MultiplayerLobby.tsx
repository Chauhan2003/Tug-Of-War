import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { connectSocket, disconnectSocket } from '../../lib/socket';

export default function MultiplayerLobby() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [createdRoom, setCreatedRoom] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState(0);

  useEffect(() => {
    const socket = connectSocket();

    socket.emit('get-active-players', (data: any) => {
      setOnlinePlayers(data.players || 0);
    });

    socket.on('player-joined', (data: any) => {
      if (data.status === 'ready') {
        // Opponent joined, will receive match-ready event
      }
    });

    socket.on('match-ready', (data: any) => {
      navigate('/match-ready', {
        state: {
          players: data.players,
          roomCode: createdRoom || roomCode,
          multiplayer: true,
        },
      });
    });

    return () => {
      socket.off('player-joined');
      socket.off('match-ready');
    };
  }, [navigate, createdRoom, roomCode]);

  const generateRoomCode = useCallback(() => {
    setError('');
    const socket = connectSocket();
    socket.emit('create-room', {}, (response: any) => {
      if (response.success) {
        setCreatedRoom(response.roomCode);
        setWaiting(true);
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  }, []);

  const joinRoom = useCallback(() => {
    if (roomCode.length < 6) return;
    setError('');
    const socket = connectSocket();
    socket.emit('join-room', roomCode.toUpperCase(), (response: any) => {
      if (!response.success) {
        setError(response.error || 'Failed to join room');
      }
      // If success, match-ready event will fire
    });
  }, [roomCode]);

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
            onClick={() => navigate(-1)}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-lg sm:text-xl shadow-lg active:scale-95 transition-transform shrink-0"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl text-white font-bold drop-shadow-md">Multiplayer Lobby</h1>
        </motion.div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-center gap-3 sm:gap-4 px-4 sm:px-5 pb-4">
          {/* Create Room Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-xl"
          >
            <div className="text-center mb-3 sm:mb-4">
              <div className="text-3xl sm:text-4xl mb-1.5">🎮</div>
              <h2 className="text-xl sm:text-2xl text-gray-800 font-bold mb-0.5">Create Room</h2>
              <p className="text-[10px] sm:text-xs text-gray-500">Start a new game and invite friends</p>
            </div>

            {!createdRoom ? (
              <button
                onClick={generateRoomCode}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-base sm:text-lg font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all"
              >
                Create Room 🚀
              </button>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3.5 sm:p-4 rounded-2xl text-center">
                  <p className="text-[10px] sm:text-xs mb-1 opacity-80 font-medium">Room Code</p>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-[0.3em]">{createdRoom}</p>
                </div>
                {waiting && (
                  <div className="text-center py-1.5">
                    <div className="flex justify-center gap-2 mb-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Waiting for opponent...</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 h-0.5 bg-white/40 rounded" />
            <span className="text-white text-base sm:text-lg font-bold opacity-80">OR</span>
            <div className="flex-1 h-0.5 bg-white/40 rounded" />
          </div>

          {/* Join Room Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white/95 backdrop-blur-md rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-xl"
          >
            <div className="text-center mb-3 sm:mb-4">
              <div className="text-3xl sm:text-4xl mb-1.5">🔗</div>
              <h2 className="text-xl sm:text-2xl text-gray-800 font-bold mb-0.5">Join Room</h2>
              <p className="text-[10px] sm:text-xs text-gray-500">Enter room code to join</p>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full text-center text-xl sm:text-2xl tracking-[0.3em] p-3 sm:p-4 border-3 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 uppercase bg-gray-50 font-bold placeholder:text-gray-300 placeholder:tracking-[0.2em] transition-all"
              />
              <button
                onClick={joinRoom}
                disabled={roomCode.length < 6}
                className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white text-base sm:text-lg font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Join Game 🎯
              </button>
            </div>
          </motion.div>

          {/* Active Players Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur-md rounded-full py-2 px-4 shadow-lg mx-auto"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium">{onlinePlayers} players online</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
