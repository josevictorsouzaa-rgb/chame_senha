
export interface User {
  id: string;
  username: string;
  name: string;
  desk: string; // Now dynamic based on login selection
  totalCalls: number; // Lifetime
  stats: {
    today: number;
    month: number;
    lastCallTime: number | null; // Timestamp
  };
}

export interface Ticket {
  number: number;
  desk: string; 
  timestamp: string;
  caller?: string; // Name of the seller
  isRetroactive?: boolean; // If true, visual distinction on TV
}

export interface MusicState {
  videoId: string | null; // Used for single video OR fallback
  playlistId: string | null; // New: Supports playlists
  title: string;
  thumbnail: string;
  isPlaying: boolean;
  volume: number; // 0-100
  lastCommand?: { type: 'next' | 'prev' | 'pause' | 'play', timestamp: number }; // For remote control
}

export interface QueueState {
  currentTicket: number;
  lastCalledDesk: string | null;
  history: Ticket[];
  stats: {
    totalCallsToday: number;
    averageServiceTime: number; // in seconds
  };
  music: MusicState;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  desk: string;
}

// New Analytics Interface
export interface AnalyticsData {
  store: {
    totalCalls: number; // All time in DB
    busiestDay: { date: string; count: number };
    callsToday: number;
  };
  user: {
    totalAnnual: number; // Current Year
    totalMonth: number; // Current Month
    bestDay: { date: string; count: number };
    monthlyHistory: { month: string; count: number }[]; // For Chart
  };
}

export interface ClientEvents {
  'login': (creds: LoginPayload, callback: (res: AuthResponse) => void) => void;
  'callNext': (userId: string) => void;
  'callSpecific': (payload: { number: number; userId: string; isRetroactive: boolean }) => void;
  'recall': () => void;
  'revert': () => void;
  'setTicketNumber': (number: number) => void; // New: Manual sync
  'getAnalytics': (userId: string, callback: (data: AnalyticsData) => void) => void;
  'setMusic': (music: Partial<MusicState>) => void;
  'playerControl': (action: 'next' | 'prev' | 'play' | 'pause') => void;
}

export interface SocketEvents {
  'init': (state: QueueState) => void;
  'update': (state: QueueState & { recall?: boolean }) => void;
  'user_update': (user: User) => void;
  'error': (msg: string) => void;
  'player_command': (action: 'next' | 'prev' | 'play' | 'pause') => void;
}
