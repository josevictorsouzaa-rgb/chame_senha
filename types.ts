export interface User {
  id: string;
  username: string;
  name: string;
  desk: string;
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

export interface QueueState {
  currentTicket: number;
  lastCalledDesk: string | null;
  history: Ticket[];
  stats: {
    totalCallsToday: number;
    averageServiceTime: number; // in seconds
  };
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface ClientEvents {
  'login': (creds: {username: string; password: string}, callback: (res: AuthResponse) => void) => void;
  'callNext': (userId: string) => void;
  'callSpecific': (payload: { number: number; userId: string; isRetroactive: boolean }) => void; // For retroactive or sync
  'recall': () => void;
  'revert': () => void;
}

export interface SocketEvents {
  'init': (state: QueueState) => void;
  'update': (state: QueueState & { recall?: boolean }) => void;
  'user_update': (user: User) => void; // Update specific connected user stats
}