import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const DATA_FILE = path.join(__dirname, 'data.json');

// --- DATABASE STRUCTURE ---
let db = {
  config: {
    currentTicket: 0,
    lastCalledDesk: null,
  },
  users: [
    // Default users for testing
    { id: 'u1', username: 'vendedor1', password: '123', name: 'Carlos Silva', desk: '01', totalCalls: 0, history: [] },
    { id: 'u2', username: 'vendedor2', password: '123', name: 'Ana Souza', desk: '02', totalCalls: 0, history: [] },
    { id: 'admin', username: 'admin', password: 'admin', name: 'Gerente', desk: 'ADM', totalCalls: 0, history: [] }
  ],
  history: [], // Global Ticket History for Display
  dailyStats: {
    date: new Date().toLocaleDateString(),
    count: 0,
    totalDuration: 0, // Sum of all service times in seconds
  }
};

// --- HELPER FUNCTIONS ---

const getMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const resetDailyStatsIfNeeded = () => {
  const today = new Date().toLocaleDateString();
  if (db.dailyStats.date !== today) {
    db.dailyStats = {
      date: today,
      count: 0,
      totalDuration: 0
    };
    // Reset daily counters for users internally if needed, 
    // but we calculate user daily stats dynamically from logs usually. 
    // For simplicity in this file-based DB, we'll keep a simple counter.
    console.log('Daily stats reset for new day:', today);
    saveData();
  }
};

const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE);
      const loaded = JSON.parse(raw);
      
      // Merge with defaults to ensure structure
      db = {
        ...db,
        ...loaded,
        config: { ...db.config, ...loaded.config },
        users: loaded.users || db.users, // Keep loaded users or defaults
        history: loaded.history || [],
        dailyStats: loaded.dailyStats || db.dailyStats
      };
      console.log('Database loaded.');
    } else {
      saveData();
      console.log('Database created.');
    }
  } catch (err) {
    console.error('Error loading data:', err);
  }
};

const saveData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
};

// --- LOGIC ---

// Calculate Average Service Time (Global)
const getAvgServiceTime = () => {
  if (db.dailyStats.count === 0) return 0;
  return Math.round(db.dailyStats.totalDuration / db.dailyStats.count);
};

// Get Public Queue State
const getPublicState = () => ({
  currentTicket: db.config.currentTicket,
  lastCalledDesk: db.config.lastCalledDesk,
  history: db.history.slice(0, 10),
  stats: {
    totalCallsToday: db.dailyStats.count,
    averageServiceTime: getAvgServiceTime()
  }
});

// Calculate User Stats for Frontend
const getUserStats = (userId) => {
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;

  const todayStr = new Date().toLocaleDateString();
  const monthKey = getMonthKey();

  // Filter user history (stored in user object for this simple DB)
  // Note: In a real SQL DB, we would query the 'logs' table.
  // Here we assume user.history contains { timestamp, action }
  
  const userHistory = user.history || [];
  const callsToday = userHistory.filter(h => new Date(h.timestamp).toLocaleDateString() === todayStr).length;
  const callsMonth = userHistory.filter(h => {
    const d = new Date(h.timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthKey;
  }).length;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    desk: user.desk,
    totalCalls: user.totalCalls,
    stats: {
      today: callsToday,
      month: callsMonth,
      lastCallTime: user.lastCallTimestamp || null
    }
  };
};

loadData();
resetDailyStatsIfNeeded();

io.on('connection', (socket) => {
  // console.log('Client connected:', socket.id);
  socket.emit('init', getPublicState());

  // --- AUTH ---
  socket.on('login', ({ username, password }, callback) => {
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
      const userData = getUserStats(user.id);
      callback({ success: true, user: userData });
    } else {
      callback({ success: false, message: 'Credenciais inválidas.' });
    }
  });

  // --- ACTIONS ---

  socket.on('callNext', (userId) => {
    resetDailyStatsIfNeeded();
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    // 1. Calculate Duration since last call (Service Time)
    const now = Date.now();
    if (user.lastCallTimestamp) {
      const durationSeconds = (now - user.lastCallTimestamp) / 1000;
      // Filter realistic times (e.g., ignore if > 1 hour, probably lunch break)
      if (durationSeconds < 3600) {
        db.dailyStats.totalDuration += durationSeconds;
      }
    }

    // 2. Logic
    db.config.currentTicket++;
    db.config.lastCalledDesk = user.desk;

    // 3. Stats Update
    db.dailyStats.count++;
    user.totalCalls++;
    user.lastCallTimestamp = now;
    if (!user.history) user.history = [];
    user.history.push({ timestamp: new Date().toISOString(), number: db.config.currentTicket });

    // 4. Global History
    db.history.unshift({
      number: db.config.currentTicket,
      desk: user.desk,
      timestamp: new Date().toISOString(),
      caller: user.name
    });
    if (db.history.length > 20) db.history.pop();

    saveData();
    io.emit('update', getPublicState());
    socket.emit('user_update', getUserStats(userId)); // Update only the caller
  });

  socket.on('callSpecific', ({ number, userId, isRetroactive }) => {
    resetDailyStatsIfNeeded();
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    // If strictly retroactive/recall of old number, we might NOT want to increment daily count stats?
    // Requirement says: "Chamar senha retroativa". Usually this means calling a number that was skipped.
    // We will display it, but maybe NOT advance the "currentTicket" counter if it's lower.
    
    // However, if we are just manually setting the counter forward, we update currentTicket.
    
    let displayTicket = number;
    
    if (!isRetroactive) {
       // Manual Sync forward
       db.config.currentTicket = number;
       db.config.lastCalledDesk = user.desk;
       user.lastCallTimestamp = Date.now(); // Reset timer
    } else {
       // Retroactive Call (just announce, don't change main counter)
       db.config.lastCalledDesk = user.desk;
    }

    // Add to history so it appears on TV
    db.history.unshift({
      number: displayTicket,
      desk: user.desk,
      timestamp: new Date().toISOString(),
      caller: user.name,
      isRetroactive: !!isRetroactive
    });

    saveData();
    io.emit('update', getPublicState());
  });

  socket.on('recall', () => {
    io.emit('update', { ...getPublicState(), recall: true });
  });

  socket.on('revert', () => {
     if (db.config.currentTicket > 0) {
        db.config.currentTicket--;
        // Remove top history if matches
        if (db.history.length > 0 && db.history[0].number === db.config.currentTicket + 1) {
            db.history.shift();
        }
        // Try to restore previous desk
        const prev = db.history[0];
        db.config.lastCalledDesk = prev ? prev.desk : null;
        
        saveData();
        io.emit('update', getPublicState());
     }
  });

});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});