import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueState, User, AuthResponse, LoginPayload, AnalyticsData, MusicState } from '../types';

export const useQueueSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({
    currentTicket: 0,
    lastCalledDesk: null,
    history: [],
    stats: { totalCallsToday: 0, averageServiceTime: 0 },
    music: { videoId: null, playlistId: null, title: '', thumbnail: '', isPlaying: false, volume: 50 }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);
  const [playerCommand, setPlayerCommand] = useState<{action: string, timestamp: number} | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Determine connection URL
    // In production (served by server.js), undefined works (same origin).
    // In dev, we try to use the proxy (undefined -> localhost:3000/socket.io).
    // However, if proxy fails, we might want to configure this differently.
    // For robustness, we stick to 'undefined' to leverage the proxy or same-origin.
    
    // Check if we are in development mode to enable debug logs
    const isDev = (import.meta as any).env?.DEV;
    if (isDev) console.log('Initializing socket connection...');

    socketRef.current = io(undefined, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: Infinity, // Keep trying
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        forceNew: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
        setIsConnected(true);
        if (isDev) console.log('Socket connected successfully:', socket.id);
        localStorage.removeItem('autoparts_user');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err.message);
        setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
        setIsConnected(false);
        if (isDev) console.warn('Socket disconnected:', reason);
    });

    socket.on('init', (data: QueueState) => setQueueState(data));
    
    socket.on('update', (data: QueueState & { recall?: boolean }) => {
        setQueueState(data);
        setLastUpdateTimestamp(Date.now());
    });

    socket.on('user_update', (user: User) => {
        setCurrentUser(user);
    });
    
    socket.on('player_command', (action: string) => {
        setPlayerCommand({ action, timestamp: Date.now() });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // --- ACTIONS ---

  const login = (creds: LoginPayload): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
             resolve({ success: false, message: 'Erro de conexão: Servidor indisponível.' });
             return;
        }
        socketRef.current.emit('login', creds, (response: AuthResponse) => {
            if (response.success && response.user) {
                setCurrentUser(response.user);
            }
            resolve(response);
        });
    });
  };

  const logout = () => {
      setCurrentUser(null);
      // Do not disconnect socket, just clear user state
      // We want to stay connected to receive updates
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

  const setTicketNumber = useCallback((number: number) => {
    if (socketRef.current?.connected) socketRef.current.emit('setTicketNumber', number);
  }, []);

  const getAnalytics = useCallback((callback: (data: AnalyticsData) => void) => {
    if (socketRef.current?.connected && currentUser) {
      socketRef.current.emit('getAnalytics', currentUser.id, callback);
    }
  }, [currentUser]);

  const setMusic = useCallback((music: Partial<MusicState>) => {
    if (socketRef.current?.connected) socketRef.current.emit('setMusic', music);
  }, []);

  const sendPlayerCommand = useCallback((action: 'next' | 'prev' | 'play' | 'pause') => {
    if (socketRef.current?.connected) socketRef.current.emit('playerControl', action);
  }, []);

  return {
    isConnected,
    queueState,
    currentUser,
    lastUpdateTimestamp,
    playerCommand,
    actions: {
      login,
      logout,
      callNext,
      callSpecific,
      recallCurrent,
      revertPrevious,
      setTicketNumber,
      getAnalytics,
      setMusic,
      sendPlayerCommand
    }
  };
};