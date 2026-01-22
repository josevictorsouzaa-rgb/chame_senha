import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueState } from '../types';

// Default to localhost:3001
const SERVER_URL = 'http://localhost:3001';

export const useQueueSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({
    currentTicket: 0,
    lastCalledDesk: null,
    history: [],
  });
  
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Check for Mixed Content issues (HTTPS trying to hit HTTP)
    if (window.location.protocol === 'https:' && SERVER_URL.startsWith('http:')) {
      console.warn("Attempting to connect to insecure WebSocket (http) from secure origin (https). This may be blocked by the browser.");
    }

    try {
        socketRef.current = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected successfully');
            setIsConnected(true);
        });

        socket.on('connect_error', (err) => {
            // Silently fail after some logs, let the UI handle offline state
            console.debug('Socket connection error:', err.message);
            setIsConnected(false);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('init', (data: QueueState) => {
            setQueueState(data);
        });

        socket.on('update', (data: QueueState & { recall?: boolean }) => {
            setQueueState(data);
            setLastUpdateTimestamp(Date.now());
        });

    } catch (error) {
        console.error("Socket initialization failed completely:", error);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // --- Actions ---
  // In a real app, these emit to server. 
  // If we are "offline"/demo mode, we could simulate them locally, 
  // but for now we just try to emit. The TVDisplay component handles the Demo UI state manually if needed.
  
  const callNext = useCallback((desk: string) => {
    if (socketRef.current?.connected) {
        socketRef.current.emit('callNext', desk);
    } else {
        // Fallback Simulation for Demo Mode
        setQueueState(prev => {
            const next = (prev.currentTicket || 0) + 1;
            const history = [{ number: next, desk, timestamp: new Date().toISOString() }, ...prev.history].slice(0, 5);
            return { ...prev, currentTicket: next, lastCalledDesk: desk, history };
        });
        setLastUpdateTimestamp(Date.now());
    }
  }, []);

  const recallCurrent = useCallback(() => {
    if (socketRef.current?.connected) {
        socketRef.current.emit('recall');
    } else {
         // Simulation
         setLastUpdateTimestamp(Date.now());
    }
  }, []);

  const updateNumber = useCallback((newNumber: number) => {
    if (socketRef.current?.connected) {
        socketRef.current.emit('updateNumber', newNumber);
    } else {
        // Simulation
        setQueueState(prev => ({ ...prev, currentTicket: newNumber }));
    }
  }, []);

  const revertPrevious = useCallback(() => {
    if (socketRef.current?.connected) {
        socketRef.current.emit('revert');
    } else {
        // Simulation
        setQueueState(prev => ({ ...prev, currentTicket: Math.max(0, (prev.currentTicket || 0) - 1) }));
    }
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