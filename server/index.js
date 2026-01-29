import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const app = express();
app.use(express.json({ limit: '1mb' }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const aiServerUrl = process.env.AI_SERVER_URL;
const aiServerApiKey = process.env.AI_SERVER_API_KEY;
const rateWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const rateMax = Number(process.env.AI_RATE_LIMIT_MAX || 250);

if (!aiServerUrl) {
  console.warn('[ai-proxy] AI_SERVER_URL is not set. /api/ai requests will fail.');
}

const limiter = rateLimit({
  windowMs: rateWindowMs,
  max: rateMax,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/ai', limiter);

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
