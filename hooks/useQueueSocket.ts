import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueState } from '../types';

// Default to localhost:3001 for development if no env var
// In production, this would be your backend URL
const SERVER_URL = 'http://localhost:3001';

export const useQueueSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({
    currentTicket: 0,
    lastCalledDesk: null,
    history: [],
  });
  
  // Use a ref to keep track of whether we had a recall event
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket', 'polling'], // Robustness
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to Queue Server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Queue Server');
      setIsConnected(false);
    });

    socket.on('init', (data: QueueState) => {
      setQueueState(data);
    });

    socket.on('update', (data: QueueState & { recall?: boolean }) => {
      setQueueState(data);
      // Trigger a visual/audio effect by updating a timestamp
      setLastUpdateTimestamp(Date.now());
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const callNext = useCallback((desk: string) => {
    socketRef.current?.emit('callNext', desk);
  }, []);

  const recallCurrent = useCallback(() => {
    socketRef.current?.emit('recall');
  }, []);

  const updateNumber = useCallback((newNumber: number) => {
    socketRef.current?.emit('updateNumber', newNumber);
  }, []);

  const revertPrevious = useCallback(() => {
    socketRef.current?.emit('revert');
  }, []);

  return {
    isConnected,
    queueState,
    lastUpdateTimestamp,
    actions: {
      callNext,
      recallCurrent,
      updateNumber,
      revertPrevious
    }
  };
};