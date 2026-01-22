const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// In a real deployment, we would serve static build files here
// app.use(express.static(path.join(__dirname, 'dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity in this demo environment
    methods: ["GET", "POST"]
  }
});

const DATA_FILE = path.join(__dirname, 'data.json');

// Initial State
let queueState = {
  currentTicket: 0,
  lastCalledDesk: null,
  history: [] // Array of { number, desk, timestamp }
};

// Persistence Logic
const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE);
      const data = JSON.parse(raw);
      // Validate structure to avoid crashes on bad data
      queueState = {
        currentTicket: typeof data.currentTicket === 'number' ? data.currentTicket : 0,
        lastCalledDesk: data.lastCalledDesk || null,
        history: Array.isArray(data.history) ? data.history : []
      };
      console.log('Data loaded successfully:', queueState);
    } else {
      console.log('No existing data file. Starting fresh.');
      saveData();
    }
  } catch (err) {
    console.error('Error loading data:', err);
  }
};

const saveData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(queueState, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
};

// Load data on startup
loadData();

// Queue Logic
const addToHistory = (number, desk) => {
  if (number === 0) return;
  
  const newEntry = {
    number,
    desk,
    timestamp: new Date().toISOString()
  };

  // Add to start of history
  queueState.history.unshift(newEntry);
  
  // Keep only last 10 entries to prevent infinite growth
  if (queueState.history.length > 10) {
    queueState.history = queueState.history.slice(0, 10);
  }
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state
  socket.emit('init', queueState);

  // 1. Call Next
  socket.on('callNext', (desk) => {
    // Atomic increment in Node's single thread event loop
    queueState.currentTicket++;
    queueState.lastCalledDesk = desk;
    
    addToHistory(queueState.currentTicket, desk);
    saveData();
    
    // Broadcast to all clients (TVs and Sellers)
    io.emit('update', queueState);
  });

  // 2. Recall Current (Re-announce)
  socket.on('recall', () => {
    // Just re-emit the current state with a specific flag if needed, 
    // but for now, re-emitting update triggers the UI hooks again
    io.emit('update', { ...queueState, recall: true });
  });

  // 3. Update Manually (Sync physical paper)
  socket.on('updateNumber', (newNumber) => {
    const num = parseInt(newNumber, 10);
    if (!isNaN(num) && num >= 0) {
      queueState.currentTicket = num;
      // We do not add to history on manual set, usually, or we can choose to.
      // Let's NOT add to history to avoid cluttering it with adjustments.
      saveData();
      io.emit('update', queueState);
    }
  });

  // 4. Revert (Undo last action)
  socket.on('revert', () => {
    if (queueState.currentTicket > 0) {
      queueState.currentTicket--;
      
      // Try to find the previous desk from history if it matches the new current number
      const prevEntry = queueState.history.find(h => h.number === queueState.currentTicket);
      queueState.lastCalledDesk = prevEntry ? prevEntry.desk : null;

      // Remove the "undone" ticket from history if it's at the top
      if (queueState.history.length > 0 && queueState.history[0].number === (queueState.currentTicket + 1)) {
        queueState.history.shift();
      }

      saveData();
      io.emit('update', queueState);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});