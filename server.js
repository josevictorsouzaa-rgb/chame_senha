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
    music: {
      videoId: 'jfKfPfyJRdk', // Default Lofi Girl or similar
      title: 'Rádio Loja',
      thumbnail: '',
      isPlaying: false,
      volume: 50
    }
  },
  users: [
    { id: 'u1', username: 'vendedor1', password: '123', name: 'Carlos Silva', totalCalls: 0, history: [] },
    { id: 'u2', username: 'vendedor2', password: '123', name: 'Ana Souza', totalCalls: 0, history: [] },
    { id: 'u3', username: 'vendedor3', password: '123', name: 'Roberto Firmino', totalCalls: 0, history: [] },
    { id: 'admin', username: 'admin', password: 'admin', name: 'Gerente Operacional', totalCalls: 0, history: [] }
  ],
  history: [], 
  dailyStats: {
    date: new Date().toLocaleDateString(),
    count: 0,
    totalDuration: 0, 
  }
};

const activeDesks = new Map(); 

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
        // Merge config.music separately to ensure defaults exist
        users: (loaded.users || db.users).map(u => ({...u, history: u.history || []})),
        history: loaded.history || [],
        dailyStats: loaded.dailyStats || db.dailyStats
      };
      // Ensure music object exists if loading from old DB
      if (!db.config.music) {
          db.config.music = { videoId: null, title: '', thumbnail: '', isPlaying: false, volume: 50 };
      }
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

const getAvgServiceTime = () => {
  if (db.dailyStats.count <= 1) return 0;
  return Math.round(db.dailyStats.totalDuration / db.dailyStats.count);
};

const getPublicState = () => ({
  currentTicket: db.config.currentTicket,
  lastCalledDesk: db.config.lastCalledDesk,
  history: db.history.slice(0, 10),
  stats: {
    totalCallsToday: db.dailyStats.count,
    averageServiceTime: getAvgServiceTime()
  },
  music: db.config.music
});

const getUserStats = (userId, currentDesk) => {
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
    desk: currentDesk,
    totalCalls: user.totalCalls,
    stats: {
      today: callsToday,
      month: callsMonth,
      lastCallTime: user.lastCallTimestamp || null
    }
  };
};

// Analytics Logic (Simplified for brevity, same as before)
const calculateAnalytics = (userId) => {
  const user = db.users.find(u => u.id === userId);
  const currentYear = new Date().getFullYear();
  const currentMonthKey = getMonthKey();
  const allUserHistories = db.users.flatMap(u => u.history || []);

  const storeByDate = {};
  let storeMaxDay = { date: '-', count: 0 };
  
  allUserHistories.forEach(h => {
    const d = new Date(h.timestamp);
    const dateKey = d.toLocaleDateString();
    storeByDate[dateKey] = (storeByDate[dateKey] || 0) + 1;
    if (storeByDate[dateKey] > storeMaxDay.count) {
      storeMaxDay = { date: dateKey, count: storeByDate[dateKey] };
    }
  });

  const userHistory = user?.history || [];
  const userByDate = {};
  const userByMonth = {}; 
  let userBestDay = { date: '-', count: 0 };
  let annualCount = 0;
  let monthCount = 0;

  userHistory.forEach(h => {
    const d = new Date(h.timestamp);
    const dateKey = d.toLocaleDateString();
    const year = d.getFullYear();
    const monthIndex = d.getMonth(); 
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    userByDate[dateKey] = (userByDate[dateKey] || 0) + 1;
    if (userByDate[dateKey] > userBestDay.count) {
      userBestDay = { date: dateKey, count: userByDate[dateKey] };
    }

    if (year === currentYear) {
      annualCount++;
      userByMonth[monthIndex] = (userByMonth[monthIndex] || 0) + 1;
    }

    if (monthKey === currentMonthKey) {
      monthCount++;
    }
  });

  const monthlyHistory = [];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  for(let i=0; i<12; i++) {
    monthlyHistory.push({
      month: months[i],
      count: userByMonth[i] || 0
    });
  }

  return {
    store: {
      totalCalls: allUserHistories.length,
      busiestDay: storeMaxDay,
      callsToday: db.dailyStats.count
    },
    user: {
      totalAnnual: annualCount,
      totalMonth: monthCount,
      bestDay: userBestDay,
      monthlyHistory
    }
  };
};

loadData();
resetDailyStatsIfNeeded();

io.on('connection', (socket) => {
  socket.emit('init', getPublicState());

  socket.on('login', ({ username, password, desk }, callback) => {
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) return callback({ success: false, message: 'Credenciais inválidas.' });
    
    const usedDesks = Array.from(activeDesks.values());
    if (usedDesks.includes(desk)) return callback({ success: false, message: `Balcão ${desk} já está em uso.` });

    activeDesks.set(socket.id, desk);
    callback({ success: true, user: getUserStats(user.id, desk) });
  });

  socket.on('disconnect', () => {
    if (activeDesks.has(socket.id)) activeDesks.delete(socket.id);
  });

  socket.on('getAnalytics', (userId, callback) => {
    callback(calculateAnalytics(userId));
  });

  socket.on('setTicketNumber', (number) => {
    db.config.currentTicket = number;
    saveData();
    io.emit('update', getPublicState());
  });

  // --- MUSIC CONTROL ---
  socket.on('setMusic', (musicState) => {
      db.config.music = { ...db.config.music, ...musicState };
      saveData();
      io.emit('update', getPublicState());
  });

  socket.on('callNext', (userId) => {
    resetDailyStatsIfNeeded();
    const user = db.users.find(u => u.id === userId);
    const desk = activeDesks.get(socket.id);

    if (!user || !desk) return;

    db.config.currentTicket++;
    db.config.lastCalledDesk = desk;
    db.dailyStats.count++;
    user.totalCalls++;
    user.lastCallTimestamp = Date.now();
    
    if (!user.history) user.history = [];
    user.history.unshift({ timestamp: new Date().toISOString(), number: db.config.currentTicket, desk: desk });
    
    db.history.unshift({
      number: db.config.currentTicket,
      desk: desk,
      timestamp: new Date().toISOString(),
      caller: user.name
    });
    if (db.history.length > 20) db.history.pop();

    saveData();
    io.emit('update', getPublicState());
    socket.emit('user_update', getUserStats(userId, desk));
  });

  socket.on('callSpecific', ({ number, userId, isRetroactive }) => {
    resetDailyStatsIfNeeded();
    const user = db.users.find(u => u.id === userId);
    const desk = activeDesks.get(socket.id);
    if (!user || !desk) return;
    
    if (!isRetroactive) {
       db.config.currentTicket = number;
       db.config.lastCalledDesk = desk;
       user.lastCallTimestamp = Date.now(); 
    } else {
       db.config.lastCalledDesk = desk;
    }

    const ticketEntry = {
      number: number,
      desk: desk,
      timestamp: new Date().toISOString(),
      caller: user.name,
      isRetroactive: !!isRetroactive
    };

    db.history.unshift(ticketEntry);
    
    if (!isRetroactive) {
       if (!user.history) user.history = [];
       user.history.unshift(ticketEntry);
    }

    saveData();
    io.emit('update', getPublicState());
    socket.emit('user_update', getUserStats(userId, desk));
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