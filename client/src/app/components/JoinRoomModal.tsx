import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { connectSocket } from '../../lib/socket';

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export default function JoinRoomModal({ open, onClose }: JoinRoomModalProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setError('');
    setJoining(true);

    const socket = connectSocket();

    // Listen for match-ready after joining
    const onMatchReady = (data: any) => {
      socket.off('match-ready', onMatchReady);
      navigate('/match-ready', {
        state: {
          players: data.players,
          roomCode: trimmed,
          multiplayer: true,
        },
      });
    };
    socket.on('match-ready', onMatchReady);

    socket.emit('join-room', trimmed, (response: any) => {
      if (!response.success) {
        socket.off('match-ready', onMatchReady);
        setError(response.error || 'Failed to join room');
        setJoining(false);
      }
    });
  };

  const handleClose = () => {
    setCode('');
    setError('');
    setJoining(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[1.5rem] sm:rounded-[1.5rem] p-5 sm:p-6 shadow-2xl w-full max-w-sm mx-4 mb-0 sm:mb-0"
          >
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">🎮</div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Join Room</h2>
              <p className="text-xs text-gray-500 mt-0.5">Enter the 6-character room code</p>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 6));
                setError('');
              }}
              placeholder="ABCD23"
              maxLength={6}
              autoFocus
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-center text-2xl font-bold text-gray-800 tracking-[0.3em] uppercase focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.3em]"
            />

            {error && (
              <p className="text-xs text-red-500 text-center font-medium mt-2">{error}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 active:scale-[0.97] transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joining || code.length < 6}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:shadow-lg active:scale-[0.97] transition-all disabled:opacity-40 text-sm"
              >
                {joining ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
