export interface User {
  id: string;
  username: string;
  name: string;
  desk: string; 
  totalCalls: number; 
  stats: {
    today: number;
    month: number;
    lastCallTime: number | null; 
  };
}

export interface Ticket {
  number: number;
  desk: string; 
  timestamp: string;
  caller?: string; 
  isRetroactive?: boolean; 
}

export interface MusicState {
  videoId: string | null;
  playlistId?: string | null;
  title: string;
  thumbnail: string;
  isPlaying: boolean;
  volume: number;
}

export interface QueueState {
  currentTicket: number;
  lastCalledDesk: string | null;
  history: Ticket[];
  stats: {
    totalCallsToday: number;
    averageServiceTime: number; 
  };
  music: MusicState; // Added Music State
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

export interface AnalyticsData {
  store: {
    totalCalls: number; 
    busiestDay: { date: string; count: number };
    callsToday: number;
  };
  user: {
    totalAnnual: number; 
    totalMonth: number; 
    bestDay: { date: string; count: number };
    monthlyHistory: { month: string; count: number }[]; 
  };
}

export interface ClientEvents {
  'login': (creds: LoginPayload, callback: (res: AuthResponse) => void) => void;
  'callNext': (userId: string) => void;
  'callSpecific': (payload: { number: number; userId: string; isRetroactive: boolean }) => void;
  'recall': () => void;
  'revert': () => void;
  'setTicketNumber': (number: number) => void; 
  'getAnalytics': (userId: string, callback: (data: AnalyticsData) => void) => void;
  'setMusic': (music: Partial<MusicState>) => void; // New Event
}

export interface SocketEvents {
  'init': (state: QueueState) => void;
  'update': (state: QueueState & { recall?: boolean }) => void;
  'user_update': (user: User) => void;
  'error': (msg: string) => void;
}