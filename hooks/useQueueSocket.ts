import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueState, User, AuthResponse, LoginPayload, AnalyticsData, MusicState } from '../types';

// DYNAMIC SERVER URL
const getSocketUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3001`;
};

export const useQueueSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({
    currentTicket: 0,
    lastCalledDesk: null,
    history: [],
    stats: { totalCallsToday: 0, averageServiceTime: 0 },
    music: { videoId: null, title: '', thumbnail: '', isPlaying: false, volume: 50 }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const serverUrl = getSocketUrl();
    console.log('Connecting to socket at:', serverUrl);
    
    socketRef.current = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10, 
        timeout: 20000
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
        localStorage.removeItem('autoparts_user');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('init', (data: QueueState) => setQueueState(data));
    
    socket.on('update', (data: QueueState & { recall?: boolean }) => {
        setQueueState(data);
        setLastUpdateTimestamp(Date.now());
    });

    socket.on('user_update', (user: User) => {
        setCurrentUser(user);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // --- ACTIONS ---

  const login = (creds: LoginPayload): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
             resolve({ success: false, message: 'Sem conexão com servidor. Verifique o Wi-Fi.' });
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
      if (socketRef.current) socketRef.current.disconnect();
      const serverUrl = getSocketUrl();
      socketRef.current = io(serverUrl);
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
      revertPrevious,
      setTicketNumber,
      getAnalytics,
      setMusic
    }
  };
};