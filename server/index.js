import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import {
  handleAuthLogout,
  handleAuthMe,
  handleAuthProfile,
  handleAuthSession,
  handleLeaderboardMe,
  handleLeaderboardSession,
  handleLeaderboardTop,
} from './firebaseApi.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';
const appPort = Number(process.env.PORT || 5174);
const serverHost = process.env.HOST || '127.0.0.1';
const aiServerUrl = process.env.AI_SERVER_URL;
const aiServerApiKey = process.env.AI_SERVER_API_KEY;
const aiClientKey = process.env.AI_CLIENT_KEY;
const rateWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const rateMax = Number(process.env.AI_RATE_LIMIT_MAX || 250);

if (!aiServerUrl) {
  console.warn('[ai-proxy] AI_SERVER_URL is not set. /api/ai requests will fail.');
}

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: isProduction
    ? {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://www.gstatic.com', 'https://www.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://www.googleapis.com', 'https://www.google.com', 'https://www.gstatic.com'],
        frameSrc: ['https://www.google.com'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    }
    : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: rateWindowMs,
  max: rateMax,
  standardHeaders: true,
  legacyHeaders: false,
});

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
    res.status(401).json({ error: { message: 'Unauthorized' } });
    return;
  }
  next();
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

app.use('/api/ai', requireClientKey, limiter);

app.get('/api/auth/me', handleAuthMe);
app.post('/api/auth/session', handleAuthSession);
app.post('/api/auth/logout', handleAuthLogout);
app.patch('/api/auth/profile', handleAuthProfile);
app.get('/api/leaderboard/top', handleLeaderboardTop);
app.get('/api/leaderboard/me', handleLeaderboardMe);
app.post('/api/leaderboard/session', handleLeaderboardSession);

app.post('/api/ai/chat/completions', async (req, res) => {
  if (!aiServerUrl) {
    res.status(503).json({ error: { message: 'AI server not configured' } });
    return;
  }

  try {
    const response = await fetch(buildTarget('/chat/completions'), {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(req.body),
    });
    const data = await readJson(response);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[ai-proxy] chat/completions failed:', error);
    res.status(502).json({ error: { message: 'AI proxy error' } });
  }
});

app.get('/api/ai/models', async (_req, res) => {
  if (!aiServerUrl) {
    res.status(503).json({ error: { message: 'AI server not configured' } });
    return;
  }

  try {
    const response = await fetch(buildTarget('/models'), {
      headers: buildHeaders(),
    });
    const data = await readJson(response);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[ai-proxy] models failed:', error);
    res.status(502).json({ error: { message: 'AI proxy error' } });
  }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(appPort, serverHost, () => {
  console.log(`[server] listening on http://${serverHost}:${appPort}`);
});
