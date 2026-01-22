export interface Ticket {
  number: number;
  desk: string; // The counter/desk calling the number
  timestamp: string;
}

export interface QueueState {
  currentTicket: number | null;
  lastCalledDesk: string | null;
  history: Ticket[];
}

export interface SocketEvents {
  'init': (state: QueueState) => void;
  'update': (state: QueueState) => void;
  'connect': () => void;
  'disconnect': () => void;
}

export interface ClientEvents {
  'callNext': (desk: string) => void;
  'recall': () => void;
  'updateNumber': (newNumber: number) => void;
  'revert': () => void;
}