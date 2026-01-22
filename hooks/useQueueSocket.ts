import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueState, User, AuthResponse } from '../types';

const SERVER_URL = 'http://localhost:3001';

export const useQueueSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({
    currentTicket: 0,
    lastCalledDesk: null,
    history: [],
    stats: { totalCallsToday: 0, averageServiceTime: 0 }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
        setIsConnected(true);
        // Try to restore session if localStorage has user data (simple persistence)
        const savedUser = localStorage.getItem('autoparts_user');
        if (savedUser) {
           setCurrentUser(JSON.parse(savedUser));
        }
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('init', (data: QueueState) => setQueueState(data));
    
    socket.on('update', (data: QueueState & { recall?: boolean }) => {
        setQueueState(data);
        setLastUpdateTimestamp(Date.now());
    });

    socket.on('user_update', (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('autoparts_user', JSON.stringify(user));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // --- ACTIONS ---

  const login = (creds: any): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
             resolve({ success: false, message: 'Sem conexão com servidor.' });
             return;
        }
        socketRef.current.emit('login', creds, (response: AuthResponse) => {
            if (response.success && response.user) {
                setCurrentUser(response.user);
                localStorage.setItem('autoparts_user', JSON.stringify(response.user));
            }
            resolve(response);
        });
    });
  };

  const logout = () => {
      setCurrentUser(null);
      localStorage.removeItem('autoparts_user');
  };

  const callNext = useCallback(() => {
    if (socketRef.current?.connected && currentUser) {
        socketRef.current.emit('callNext', currentUser.id);
    }
  }, [currentUser]);

  const callSpecific = useCallback((number: number, isRetroactive: boolean) => {
    if (socketRef.current?.connected && currentUser) {
        socketRef.current.emit('callSpecific', { number, userId: currentUser.id, isRetroactive });
    }
  }, [currentUser]);

  const recallCurrent = useCallback(() => {
    if (socketRef.current?.connected) socketRef.current.emit('recall');
  }, []);

  const revertPrevious = useCallback(() => {
    if (socketRef.current?.connected) socketRef.current.emit('revert');
  }, []);

  return {
    isConnected,
    queueState,
    currentUser,
    lastUpdateTimestamp,
    actions: {
      login,
      logout,
      callNext,
      callSpecific,
      recallCurrent,
      revertPrevious
    }
  };
};