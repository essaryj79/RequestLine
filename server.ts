import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Song, RequestItem, Setlist, StageSyncState } from './src/types';

// Simple file-based persistence for "Online" mode simulation
const DATA_FILE = path.join(process.cwd(), 'performer-data.json');

interface PersistedData {
  songs: Song[];
  requests: RequestItem[];
  setlists: Setlist[];
  activeSetlist: string[];
  stageSync: StageSyncState;
}

const defaultData: PersistedData = {
  songs: [],
  requests: [],
  setlists: [],
  activeSetlist: [],
  stageSync: {
    songId: null,
    isScrolling: false,
    scrollTop: 0,
    timestamp: Date.now()
  }
};

function loadData(): PersistedData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading persisted data, using defaults:', err);
  }
  return defaultData;
}

function saveData(data: PersistedData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data to file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // In-memory runtime data loaded from persistent file
  let db = loadData();

  // Helper to sync changes
  const syncDb = () => saveData(db);

  // --- API ROUTES ---

  // Health check / online status
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', online: true });
  });

  // Songs APIs
  app.get('/api/songs', (req, res) => {
    res.json(db.songs);
  });

  app.post('/api/songs', (req, res) => {
    const newSong: Song = req.body;
    // Check if song already exists to prevent duplicates
    const idx = db.songs.findIndex(s => s.id === newSong.id);
    if (idx !== -1) {
      db.songs[idx] = newSong;
    } else {
      db.songs.push(newSong);
    }
    syncDb();
    res.json({ success: true, song: newSong });
  });

  app.post('/api/songs/bulk', (req, res) => {
    const songs: Song[] = req.body;
    songs.forEach(newSong => {
      const idx = db.songs.findIndex(s => s.id === newSong.id);
      if (idx !== -1) {
        db.songs[idx] = newSong;
      } else {
        db.songs.push(newSong);
      }
    });
    syncDb();
    res.json({ success: true, count: songs.length });
  });

  app.put('/api/songs/:id', (req, res) => {
    const { id } = req.params;
    const updatedSong: Song = req.body;
    const idx = db.songs.findIndex(s => s.id === id);
    if (idx !== -1) {
      db.songs[idx] = { ...db.songs[idx], ...updatedSong };
      syncDb();
      res.json({ success: true, song: db.songs[idx] });
    } else {
      res.status(404).json({ error: 'Song not found' });
    }
  });

  app.delete('/api/songs/:id', (req, res) => {
    const { id } = req.params;
    db.songs = db.songs.filter(s => s.id !== id);
    syncDb();
    res.json({ success: true });
  });

  // Requests APIs
  app.get('/api/requests', (req, res) => {
    res.json(db.requests);
  });

  app.post('/api/requests', (req, res) => {
    const { songId, title, artist, requesterName, tipAmount, isCustom } = req.body;
    
    // Check if this song is already requested and not played yet
    const existingIndex = db.requests.findIndex(
      r => !r.played && (isCustom ? (r.title.toLowerCase() === title.toLowerCase() && r.artist.toLowerCase() === artist.toLowerCase()) : r.songId === songId)
    );

    if (existingIndex !== -1) {
      // Increment request count, add tip amount
      db.requests[existingIndex].requestCount += 1;
      db.requests[existingIndex].tipAmount += Number(tipAmount || 0);
      db.requests[existingIndex].timestamp = new Date().toISOString();
      if (requesterName && !db.requests[existingIndex].requesterName.includes(requesterName)) {
        db.requests[existingIndex].requesterName += `, ${requesterName}`;
      }
      syncDb();
      res.json({ success: true, updated: true, request: db.requests[existingIndex] });
    } else {
      // Create new request
      const newRequest: RequestItem = {
        id: Math.random().toString(36).substring(2, 9),
        songId,
        title,
        artist,
        requesterName: requesterName || 'Anonymous',
        tipAmount: Number(tipAmount || 0),
        requestCount: 1,
        isCustom: !!isCustom,
        timestamp: new Date().toISOString(),
        played: false
      };
      db.requests.push(newRequest);
      syncDb();
      res.json({ success: true, updated: false, request: newRequest });
    }
  });

  app.post('/api/requests/played/:id', (req, res) => {
    const { id } = req.params;
    const { played } = req.body;
    const reqItem = db.requests.find(r => r.id === id);
    if (reqItem) {
      reqItem.played = played;
      syncDb();
      res.json({ success: true, request: reqItem });
    } else {
      res.status(404).json({ error: 'Request not found' });
    }
  });

  app.delete('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    db.requests = db.requests.filter(r => r.id !== id);
    syncDb();
    res.json({ success: true });
  });

  app.post('/api/gig/reset', (req, res) => {
    // End of the night reset: clears requests and returns played counters to zero for songs
    db.requests = [];
    db.songs = db.songs.map(s => ({ ...s, plays: 0 }));
    syncDb();
    res.json({ success: true });
  });

  // Stage Sync APIs
  app.get('/api/sync', (req, res) => {
    res.json(db.stageSync);
  });

  app.post('/api/sync', (req, res) => {
    const newState: StageSyncState = req.body;
    db.stageSync = {
      ...db.stageSync,
      ...newState,
      timestamp: Date.now()
    };
    syncDb();
    res.json(db.stageSync);
  });

  // Setlist APIs
  app.get('/api/setlists', (req, res) => {
    res.json(db.setlists);
  });

  app.post('/api/setlists', (req, res) => {
    const newList: Setlist = req.body;
    const idx = db.setlists.findIndex(l => l.id === newList.id);
    if (idx !== -1) {
      db.setlists[idx] = newList;
    } else {
      db.setlists.push(newList);
    }
    syncDb();
    res.json({ success: true, setlist: newList });
  });

  app.delete('/api/setlists/:id', (req, res) => {
    const { id } = req.params;
    db.setlists = db.setlists.filter(l => l.id !== id);
    syncDb();
    res.json({ success: true });
  });

  // Vite Integration for development / index routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Live performer server running on port ${PORT}`);
  });
}

startServer();
