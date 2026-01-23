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
    { id: 'u1', username: 'vendedor1', password: '123', name: 'Carlos Silva', desk: '01', totalCalls: 0, history: [] },
    { id: 'u2', username: 'vendedor2', password: '123', name: 'Ana Souza', desk: '02', totalCalls: 0, history: [] },
    { id: 'admin', username: 'admin', password: 'admin', name: 'Gerente', desk: 'ADM', totalCalls: 0, history: [] }
  ],
  history: [], // Global Ticket History
  dailyStats: {
    date: new Date().toLocaleDateString(),
    count: 0,
    totalDuration: 0, 
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
    console.log('Daily stats reset for new day:', today);
    saveData();
  }
};

const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE);
      const loaded = JSON.parse(raw);
      
      db = {
        ...db,
        ...loaded,
        config: { ...db.config, ...loaded.config },
        // Ensure users structure is correct (map over to ensure history array exists)
        users: (loaded.users || db.users).map(u => ({...u, history: u.history || []})),
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

// Calculate Average Service Time (Global - Simplified logic based on intervals)
const getAvgServiceTime = () => {
  if (db.dailyStats.count <= 1) return 0;
  // Simple avg: (Total time open / Count) - crude approximation for queue speed
  // A better metric for this specific request "time from one service to another"
  // is calculated per user when they click call.
  return Math.round(db.dailyStats.totalDuration / db.dailyStats.count);
};

const getPublicState = () => ({
  currentTicket: db.config.currentTicket,
  lastCalledDesk: db.config.lastCalledDesk,
  history: db.history.slice(0, 10),
  stats: {
    totalCallsToday: db.dailyStats.count,
    averageServiceTime: getAvgServiceTime()
  }
});

const getUserStats = (userId) => {
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;

  const todayStr = new Date().toLocaleDateString();
  const monthKey = getMonthKey();
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
  socket.emit('init', getPublicState());

  socket.on('login', ({ username, password }, callback) => {
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
      const userData = getUserStats(user.id);
      callback({ success: true, user: userData });
    } else {
      callback({ success: false, message: 'Credenciais inválidas.' });
    }
  });

  socket.on('callNext', (userId) => {
    resetDailyStatsIfNeeded();
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    const now = Date.now();
    
    // Calculate interval since LAST call by THIS user
    if (user.lastCallTimestamp) {
      const durationSeconds = (now - user.lastCallTimestamp) / 1000;
      // Sanity check: ignore if > 45 mins (likely break)
      if (durationSeconds < 2700) {
        db.dailyStats.totalDuration += durationSeconds;
      }
    }

    db.config.currentTicket++;
    db.config.lastCalledDesk = user.desk;

    db.dailyStats.count++;
    user.totalCalls++;
    user.lastCallTimestamp = now;
    
    // Store in user history
    if (!user.history) user.history = [];
    user.history.unshift({ timestamp: new Date().toISOString(), number: db.config.currentTicket });
    if(user.history.length > 50) user.history.pop(); // Keep last 50 per user

    // Store in global history
    db.history.unshift({
      number: db.config.currentTicket,
      desk: user.desk,
      timestamp: new Date().toISOString(),
      caller: user.name
    });
    if (db.history.length > 20) db.history.pop();

    saveData();
    io.emit('update', getPublicState());
    socket.emit('user_update', getUserStats(userId));
  });

  socket.on('callSpecific', ({ number, userId, isRetroactive }) => {
    resetDailyStatsIfNeeded();
    const user = db.users.find(u => u.id === userId);
    if (!user) return;
    
    let displayTicket = number;
    
    if (!isRetroactive) {
       db.config.currentTicket = number;
       db.config.lastCalledDesk = user.desk;
       user.lastCallTimestamp = Date.now(); 
    } else {
       db.config.lastCalledDesk = user.desk;
    }

    const ticketEntry = {
      number: displayTicket,
      desk: user.desk,
      timestamp: new Date().toISOString(),
      caller: user.name,
      isRetroactive: !!isRetroactive
    };

    // Add to global
    db.history.unshift(ticketEntry);
    
    // Add to user history if it's a "real" call (sync), maybe not retroactive
    if (!isRetroactive) {
       if (!user.history) user.history = [];
       user.history.unshift(ticketEntry);
    }

    saveData();
    io.emit('update', getPublicState());
    socket.emit('user_update', getUserStats(userId));
  });

  socket.on('recall', () => {
    io.emit('update', { ...getPublicState(), recall: true });
  });

  socket.on('revert', () => {
     if (db.config.currentTicket > 0) {
        db.config.currentTicket--;
        if (db.history.length > 0 && db.history[0].number === db.config.currentTicket + 1) {
            db.history.shift();
        }
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