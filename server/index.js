import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = express();
app.use(express.json({ limit: '1mb' }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const aiServerUrl = process.env.AI_SERVER_URL;
const aiServerApiKey = process.env.AI_SERVER_API_KEY;
const aiClientKey = process.env.AI_CLIENT_KEY;
const rateWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const rateMax = Number(process.env.AI_RATE_LIMIT_MAX || 250);

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let firebaseApp;
let firebaseAuth;
let firestore;
if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
  if (getApps().length === 0) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      }),
    });
  } else {
    firebaseApp = getApps()[0];
  }
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
} else {
  console.warn('[leaderboard] Firebase Admin credentials are not fully configured. Leaderboard routes will be disabled.');
}

if (!aiServerUrl) {
  console.warn('[ai-proxy] AI_SERVER_URL is not set. /api/ai requests will fail.');
}

const limiter = rateLimit({
  windowMs: rateWindowMs,
  max: rateMax,
  standardHeaders: true,
  legacyHeaders: false,
});

const leaderboardPlayers = firestore?.collection('leaderboard_players');
const leaderboardSessions = firestore?.collection('leaderboard_sessions');

const normalizePlayerDoc = (doc) => {
  const data = doc.data() || {};
  const asNumber = (value) => (typeof value === 'number' ? value : 0);
  const toISO = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value.toDate) return value.toDate().toISOString();
    return null;
  };
  return {
    uid: doc.id,
    displayName: data.displayName || 'Player',
    email: data.email || null,
    totalProfit: asNumber(data.totalProfit),
    totalGross: asNumber(data.totalGross),
    salesCount: asNumber(data.salesCount),
    bestSessionProfit: asNumber(data.bestSessionProfit) || undefined,
    lastSessionProfit: asNumber(data.lastSessionProfit) || undefined,
    lastSessionGross: asNumber(data.lastSessionGross) || undefined,
    lastSessionSales: asNumber(data.lastSessionSales) || undefined,
    lastSessionAt: toISO(data.lastSessionAt),
    mode: data.mode || null,
    rank: null,
  };
};

const requireClientKey = (req, res, next) => {
  if (!aiClientKey) return next();
  const authHeader = req.headers.authorization || '';
  let token = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token && req.headers['x-ai-client-key']) {
    token = String(req.headers['x-ai-client-key']).trim();
  }
  if (token !== aiClientKey) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  return next();
};

app.use('/api/ai', requireClientKey, limiter);

const requireFirebaseAuth = async (req, res, next) => {
  if (!firebaseAuth) {
    return res.status(503).json({ error: { message: 'Leaderboard is not configured' } });
  }
  const authHeader = (req.headers.authorization || '').toLowerCase();
  if (!authHeader.startsWith('bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.firebaseUid = decoded.uid;
    req.firebaseDisplayName = decoded.name || decoded.email || 'Player';
    req.firebaseEmail = decoded.email || null;
    next();
  } catch (err) {
    console.error('[leaderboard] Failed to verify token', err);
    return res.status(401).json({ error: { message: 'Unauthorized', details: err?.message ?? err } });
  }
};

const buildTarget = (pathname) => {
  const base = (aiServerUrl || '').replace(/\/+$/, '');
  const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${suffix}`;
};

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (aiServerApiKey) {
    headers.Authorization = `Bearer ${aiServerApiKey}`;
  }
  return headers;
};

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
};

const leaderboardLimitFromQuery = (req) => {
  const limit = Number(req.query.limit);
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return Math.min(50, limit);
};

app.post('/api/leaderboard/session', requireFirebaseAuth, async (req, res) => {
  if (!firestore || !leaderboardPlayers || !leaderboardSessions) {
    return res.status(503).json({ error: { message: 'Leaderboard is not configured' } });
  }
  const { sessionStats, mode = 'standard', durationSec = 0, timerMinutes = 0 } = req.body;
  if (!sessionStats || typeof sessionStats.gross !== 'number' || typeof sessionStats.profit !== 'number' || typeof sessionStats.salesCount !== 'number') {
    return res.status(400).json({ error: { message: 'Missing or invalid session stats' } });
  }
  try {
    const timestamp = new Date().toISOString();
    const playerRef = leaderboardPlayers.doc(req.firebaseUid);
    const updated = await firestore.runTransaction(async (tx) => {
      const playerSnap = await tx.get(playerRef);
      const existing = playerSnap.exists ? playerSnap.data() : {};
      const totalProfit = (existing.totalProfit ?? 0) + sessionStats.profit;
      const totalGross = (existing.totalGross ?? 0) + sessionStats.gross;
      const salesCount = (existing.salesCount ?? 0) + sessionStats.salesCount;
      const bestSessionProfit = Math.max(existing.bestSessionProfit ?? 0, sessionStats.profit);
      const record = {
        totalProfit,
        totalGross,
        salesCount,
        bestSessionProfit,
        lastSessionProfit: sessionStats.profit,
        lastSessionGross: sessionStats.gross,
        lastSessionSales: sessionStats.salesCount,
        lastSessionAt: timestamp,
        updatedAt: timestamp,
        displayName: req.firebaseDisplayName,
        email: req.firebaseEmail,
        mode,
      };
      tx.set(playerRef, { ...existing, ...record }, { merge: true });
      return { ...record };
    });

    await leaderboardSessions.add({
      uid: req.firebaseUid,
      mode,
      durationSec,
      timerMinutes,
      sessionStats,
      recordedAt: timestamp,
    });

    const limit = leaderboardLimitFromQuery(req);
    const topSnap = await leaderboardPlayers
      .orderBy('totalProfit', 'desc')
      .orderBy('totalGross', 'desc')
      .orderBy('salesCount', 'desc')
      .limit(limit)
      .get();

    const leaderboard = [];
    topSnap.forEach((doc, index) => {
      const entry = normalizePlayerDoc(doc);
      entry.rank = index + 1;
      leaderboard.push(entry);
    });

    const higherCountSnap = await leaderboardPlayers
      .where('totalProfit', '>', updated.totalProfit)
      .count()
      .get();
    const higherCount = higherCountSnap.data()?.count ?? 0;
    const me = {
      uid: req.firebaseUid,
      rank: higherCount + 1,
      ...updated,
    };

    return res.json({ leaderboard, me });
  } catch (err) {
    console.error('[leaderboard] Failed to save session', err);
    return res.status(500).json({ error: { message: 'Failed to save leaderboard session' } });
  }
});

app.get('/api/leaderboard/top', async (req, res) => {
  if (!firestore || !leaderboardPlayers) {
    return res.status(503).json({ error: { message: 'Leaderboard is not configured' } });
  }
  try {
    const limit = leaderboardLimitFromQuery(req);
    const topSnap = await leaderboardPlayers
      .orderBy('totalProfit', 'desc')
      .orderBy('totalGross', 'desc')
      .orderBy('salesCount', 'desc')
      .limit(limit)
      .get();
    const leaderboard = [];
    topSnap.forEach((doc, index) => {
      const entry = normalizePlayerDoc(doc);
      entry.rank = index + 1;
      leaderboard.push(entry);
    });
    return res.json({ leaderboard });
  } catch (err) {
    console.error('[leaderboard] Failed to fetch top leaderboard', err);
    return res.status(500).json({ error: { message: 'Failed to fetch leaderboard' } });
  }
});

app.get('/api/leaderboard/me', requireFirebaseAuth, async (req, res) => {
  if (!firestore || !leaderboardPlayers) {
    return res.status(503).json({ error: { message: 'Leaderboard is not configured' } });
  }
  try {
    const playerDoc = await leaderboardPlayers.doc(req.firebaseUid).get();
    if (!playerDoc.exists) {
      return res.status(404).json({ me: null });
    }
    const summary = normalizePlayerDoc(playerDoc);
    const higherCountSnap = await leaderboardPlayers
      .where('totalProfit', '>', summary.totalProfit)
      .count()
      .get();
    const higherCount = higherCountSnap.data()?.count ?? 0;
    summary.rank = higherCount + 1;
    summary.uid = req.firebaseUid;
    return res.json({ me: summary });
  } catch (err) {
    console.error('[leaderboard] Failed to fetch profile', err);
    return res.status(500).json({ error: { message: 'Failed to fetch leaderboard profile' } });
  }
});
app.post('/api/ai/chat/completions', async (req, res) => {
  if (!aiServerUrl) {
    return res.status(503).json({ error: { message: 'AI server not configured' } });
  }

  try {
    const response = await fetch(buildTarget('/chat/completions'), {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(req.body),
    });
    const data = await readJson(response);
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[ai-proxy] chat/completions failed:', err);
    return res.status(502).json({ error: { message: 'AI proxy error' } });
  }
});

app.get('/api/ai/models', async (_req, res) => {
  if (!aiServerUrl) {
    return res.status(503).json({ error: { message: 'AI server not configured' } });
  }

  try {
    const response = await fetch(buildTarget('/models'), {
      headers: buildHeaders(),
    });
    const data = await readJson(response);
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[ai-proxy] models failed:', err);
    return res.status(502).json({ error: { message: 'AI proxy error' } });
  }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = Number(process.env.PORT || 5174);
app.listen(port, () => {
  console.log(`[ai-proxy] server listening on ${port}`);
});
