import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cookie from 'cookie';
import dotenv from 'dotenv';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const { parse: parseCookieHeader, serialize: serializeCookie } = cookie;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    ...String(process.env.ALLOWED_WEB_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  ],
);

const SESSION_COOKIE_NAME = isProduction ? '__Host-showroom_session' : 'showroom_session';
const CSRF_COOKIE_NAME = isProduction ? '__Host-showroom_csrf' : 'showroom_csrf';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;
const SESSION_MAX_AGE_SEC = Math.floor(SESSION_MAX_AGE_MS / 1000);
const RECENT_SIGN_IN_MAX_AGE_SEC = 60 * 5;
const appCheckRequired = isProduction || process.env.APP_CHECK_REQUIRED === 'true';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let firebaseApp = null;
let firebaseAuth = null;
let firebaseAppCheck = null;
let firestore = null;

const parseServiceAccountJson = () => {
  if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
    return null;
  }

  try {
    const parsed = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    if (parsed.private_key) {
      parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (error) {
    console.error('[auth] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON', error);
    return null;
  }
};

const resolveFirebaseCredential = () => {
  const serviceAccountJson = parseServiceAccountJson();
  if (serviceAccountJson?.client_email && serviceAccountJson?.private_key) {
    return {
      credential: cert(serviceAccountJson),
      projectId: serviceAccountJson.project_id || FIREBASE_PROJECT_ID,
    };
  }

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      }),
      projectId: FIREBASE_PROJECT_ID,
    };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_USE_APPLICATION_DEFAULT === 'true') {
    return {
      credential: applicationDefault(),
      projectId: FIREBASE_PROJECT_ID,
    };
  }

  return null;
};

const firebaseCredential = resolveFirebaseCredential();

if (firebaseCredential) {
  firebaseApp = getApps()[0]
    ?? initializeApp({
      credential: firebaseCredential.credential,
      projectId: firebaseCredential.projectId,
    });
  firebaseAuth = getAuth(firebaseApp);
  firebaseAppCheck = getAppCheck(firebaseApp);
  firestore = getFirestore(firebaseApp);
} else {
  console.warn('[auth] Firebase Admin credentials are not fully configured. Authenticated features will be disabled.');
}

const leaderboardPlayers = firestore?.collection('leaderboard_players');
const leaderboardSessions = firestore?.collection('leaderboard_sessions');

const sessionCookieOptions = {
  httpOnly: true,
  maxAge: SESSION_MAX_AGE_SEC,
  path: '/',
  sameSite: 'lax',
  secure: isProduction,
};

const csrfCookieOptions = {
  httpOnly: false,
  maxAge: SESSION_MAX_AGE_SEC,
  path: '/',
  sameSite: 'lax',
  secure: isProduction,
};

const getHeader = (req, name) => {
  const key = name.toLowerCase();
  const value = req.headers?.[key];
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value;
  return '';
};

const parseCookies = (req) => parseCookieHeader(getHeader(req, 'cookie'));

const appendCookie = (res, serializedCookie) => {
  const current = res.getHeader('Set-Cookie');
  if (!current) {
    res.setHeader('Set-Cookie', serializedCookie);
    return;
  }
  res.setHeader(
    'Set-Cookie',
    Array.isArray(current) ? [...current, serializedCookie] : [String(current), serializedCookie],
  );
};

const setCookie = (res, name, value, options) => {
  appendCookie(res, serializeCookie(name, value, options));
};

const clearCookie = (res, name, options) => {
  appendCookie(
    res,
    serializeCookie(name, '', {
      ...options,
      expires: new Date(0),
      maxAge: 0,
    }),
  );
};

const sendJson = (res, status, payload, headers = {}) => {
  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  if (!res.getHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  if (!res.getHeader('X-Content-Type-Options')) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.statusCode = status;
  res.end(JSON.stringify(payload));
};

const issueCsrfToken = (req, res, rotate = false) => {
  const cookies = parseCookies(req);
  let csrfToken = rotate ? null : cookies[CSRF_COOKIE_NAME];
  if (!csrfToken || csrfToken.length < 32) {
    csrfToken = crypto.randomBytes(32).toString('hex');
  }
  setCookie(res, CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);
  return csrfToken;
};

const authEnabled = () => Boolean(firebaseAuth);
const firestoreEnabled = () => Boolean(firestore && leaderboardPlayers && leaderboardSessions);

const requireFirebaseConfigured = (res, scope = 'Auth') => {
  if (authEnabled()) return true;
  sendJson(res, 503, { error: { message: `${scope} is not configured` } });
  return false;
};

const requireFirestoreConfigured = (res) => {
  if (firestoreEnabled()) return true;
  sendJson(res, 503, { error: { message: 'Leaderboard is not configured' } });
  return false;
};

const normalizeDisplayName = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 32) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._'-]{1,31}$/u.test(trimmed)) return null;
  return trimmed;
};

const isPrivateIpv4Address = (hostname) => {
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!match) return false;
  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
};

const isAllowedDevOrigin = (origin) => {
  if (isProduction) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:') return false;
    if (!['5173', '4173'].includes(url.port)) return false;
    return url.hostname === 'localhost'
      || url.hostname === '127.0.0.1'
      || isPrivateIpv4Address(url.hostname);
  } catch {
    return false;
  }
};

const asNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const toISO = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return null;
};

const hasCareerStats = (entry) =>
  entry.salesCount > 0 || entry.totalGross > 0 || entry.totalProfit !== 0 || entry.bestVolumeProfit > 0;

const normalizePlayerDoc = (doc) => {
  const data = doc.data() || {};
  return {
    uid: doc.id,
    displayName: data.displayName || 'Player',
    totalProfit: asNumber(data.totalProfit),
    totalGross: asNumber(data.totalGross),
    salesCount: asNumber(data.salesCount),
    bestVolumeProfit: asNumber(data.bestVolumeProfit),
    lastSessionProfit: asNumber(data.lastSessionProfit) || undefined,
    lastSessionGross: asNumber(data.lastSessionGross) || undefined,
    lastSessionSales: asNumber(data.lastSessionSales) || undefined,
    lastSessionAt: toISO(data.lastSessionAt),
    mode: data.mode || null,
    rank: null,
  };
};

const getAllowedOrigin = (req) => {
  const origin = getHeader(req, 'origin');
  if (origin && allowedOrigins.has(origin)) {
    return origin;
  }
  if (origin && isAllowedDevOrigin(origin)) {
    return origin;
  }
  return null;
};

const ensureSameOrigin = (req, res) => {
  const allowedOrigin = getAllowedOrigin(req);
  if (!allowedOrigin) {
    sendJson(res, 403, { error: { message: 'Invalid request origin' } });
    return false;
  }
  return true;
};

const ensureCsrf = (req, res) => {
  const cookies = parseCookies(req);
  const csrfCookie = cookies[CSRF_COOKIE_NAME];
  const csrfHeader = getHeader(req, 'x-csrf-token');
  if (!csrfCookie || !csrfHeader || csrfHeader !== csrfCookie) {
    sendJson(res, 403, { error: { message: 'Invalid CSRF token' } });
    return false;
  }
  return true;
};

const ensureVerifiedAppCheck = async (req, res) => {
  if (!appCheckRequired) return true;
  if (!firebaseAppCheck) {
    sendJson(res, 503, { error: { message: 'App Check is not configured' } });
    return false;
  }
  const token = getHeader(req, 'x-firebase-appcheck').trim();
  if (!token) {
    sendJson(res, 401, { error: { message: 'Missing App Check token' } });
    return false;
  }
  try {
    await firebaseAppCheck.verifyToken(token);
    return true;
  } catch (error) {
    console.error('[auth] Invalid App Check token', error);
    sendJson(res, 401, { error: { message: 'Invalid App Check token' } });
    return false;
  }
};

const buildUserSummary = async (uid, decodedToken = null) => {
  if (!firebaseAuth) {
    return null;
  }
  const userRecord = await firebaseAuth.getUser(uid);
  return {
    uid,
    displayName: userRecord.displayName || decodedToken?.name || null,
    email: userRecord.email || decodedToken?.email || null,
    isGuest: decodedToken?.firebase?.sign_in_provider === 'anonymous',
  };
};

const readSessionCookie = (req) => {
  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE_NAME] || null;
};

const ensureSessionAuth = async (req, res) => {
  if (!requireFirebaseConfigured(res)) return null;
  const sessionCookie = readSessionCookie(req);
  if (!sessionCookie) {
    sendJson(res, 401, { error: { message: 'Unauthorized' } });
    return null;
  }

  try {
    const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
    const user = await buildUserSummary(decodedToken.uid, decodedToken);
    req.sessionUser = user;
    return user;
  } catch (error) {
    clearCookie(res, SESSION_COOKIE_NAME, sessionCookieOptions);
    console.error('[auth] Invalid session cookie', error);
    sendJson(res, 401, { error: { message: 'Unauthorized' } });
    return null;
  }
};

const readJsonBody = async (req) => {
  if ('__showroomBody' in req) {
    return req.__showroomBody;
  }

  if (typeof req.body === 'object' && req.body !== null && !Buffer.isBuffer(req.body)) {
    req.__showroomBody = req.body;
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      req.__showroomBody = JSON.parse(req.body);
    } catch {
      req.__showroomBody = {};
    }
    return req.__showroomBody;
  }

  if (Buffer.isBuffer(req.body)) {
    try {
      req.__showroomBody = JSON.parse(req.body.toString('utf8'));
    } catch {
      req.__showroomBody = {};
    }
    return req.__showroomBody;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    req.__showroomBody = {};
    return req.__showroomBody;
  }
  try {
    req.__showroomBody = JSON.parse(raw);
  } catch {
    req.__showroomBody = {};
  }
  return req.__showroomBody;
};

const getQueryValue = (req, key) => {
  if (req.query && typeof req.query === 'object' && key in req.query) {
    const value = req.query[key];
    return Array.isArray(value) ? value[0] : value;
  }
  const url = new URL(req.url || '/', 'http://localhost');
  return url.searchParams.get(key);
};

const leaderboardLimitFromQuery = (req) => {
  const limit = Number(getQueryValue(req, 'limit'));
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return Math.min(50, limit);
};

const hydrateLeaderboard = async (limit) => {
  const topSnap = await leaderboardPlayers
    .orderBy('totalProfit', 'desc')
    .orderBy('totalGross', 'desc')
    .orderBy('salesCount', 'desc')
    .limit(limit)
    .get();

  const leaderboard = [];
  topSnap.forEach((doc, index) => {
    const entry = normalizePlayerDoc(doc);
    if (!hasCareerStats(entry)) {
      return;
    }
    entry.rank = index + 1;
    leaderboard.push(entry);
  });
  return leaderboard;
};

const computePlayerRank = async (summary) => {
  const higherProfitSnap = await leaderboardPlayers
    .where('totalProfit', '>', summary.totalProfit)
    .count()
    .get();
  return (higherProfitSnap.data()?.count ?? 0) + 1;
};

const ensureMethod = (req, res, allowedMethods) => {
  if (allowedMethods.includes(req.method)) {
    return true;
  }
  res.setHeader('Allow', allowedMethods.join(', '));
  sendJson(res, 405, { error: { message: 'Method not allowed' } });
  return false;
};

const handleOptions = (req, res, allowedMethods) => {
  if (req.method !== 'OPTIONS') {
    return false;
  }
  res.setHeader('Allow', [...allowedMethods, 'OPTIONS'].join(', '));
  res.statusCode = 204;
  res.end();
  return true;
};

export const nodeApiConfig = {
  runtime: 'nodejs',
};

export const handleAuthMe = async (req, res) => {
  if (handleOptions(req, res, ['GET'])) return;
  if (!ensureMethod(req, res, ['GET'])) return;

  const csrfToken = issueCsrfToken(req, res);
  if (!authEnabled()) {
    sendJson(res, 200, { authEnabled: false, csrfToken, user: null });
    return;
  }

  const sessionCookie = readSessionCookie(req);
  if (!sessionCookie) {
    sendJson(res, 200, { authEnabled: true, csrfToken, user: null });
    return;
  }

  try {
    const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
    const user = await buildUserSummary(decodedToken.uid, decodedToken);
    sendJson(res, 200, { authEnabled: true, csrfToken, user });
  } catch (error) {
    clearCookie(res, SESSION_COOKIE_NAME, sessionCookieOptions);
    console.error('[auth] Session check failed', error);
    sendJson(res, 200, { authEnabled: true, csrfToken, user: null });
  }
};

export const handleAuthSession = async (req, res) => {
  if (handleOptions(req, res, ['POST'])) return;
  if (!ensureMethod(req, res, ['POST'])) return;
  if (!ensureSameOrigin(req, res)) return;
  if (!ensureCsrf(req, res)) return;
  if (!(await ensureVerifiedAppCheck(req, res))) return;
  if (!requireFirebaseConfigured(res)) return;

  const body = await readJsonBody(req);
  const idToken = typeof body?.idToken === 'string' ? body.idToken : '';
  if (!idToken) {
    sendJson(res, 400, { error: { message: 'Missing ID token' } });
    return;
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken, true);
    const authTime = decodedToken.auth_time ?? 0;
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (nowSeconds - authTime > RECENT_SIGN_IN_MAX_AGE_SEC) {
      sendJson(res, 401, { error: { message: 'Recent sign-in required' } });
      return;
    }

    const sessionCookie = await firebaseAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    setCookie(res, SESSION_COOKIE_NAME, sessionCookie, sessionCookieOptions);
    const csrfToken = issueCsrfToken(req, res, true);
    const user = await buildUserSummary(decodedToken.uid, decodedToken);
    sendJson(res, 200, { csrfToken, user });
  } catch (error) {
    console.error('[auth] Failed to create session', error);
    sendJson(res, 401, { error: { message: 'Unable to create session' } });
  }
};

export const handleAuthLogout = async (req, res) => {
  if (handleOptions(req, res, ['POST'])) return;
  if (!ensureMethod(req, res, ['POST'])) return;
  if (!ensureSameOrigin(req, res)) return;
  if (!ensureCsrf(req, res)) return;

  clearCookie(res, SESSION_COOKIE_NAME, sessionCookieOptions);
  const csrfToken = issueCsrfToken(req, res, true);
  sendJson(res, 200, { csrfToken, ok: true });
};

export const handleAuthProfile = async (req, res) => {
  if (handleOptions(req, res, ['PATCH'])) return;
  if (!ensureMethod(req, res, ['PATCH'])) return;
  if (!ensureSameOrigin(req, res)) return;
  if (!ensureCsrf(req, res)) return;
  if (!(await ensureVerifiedAppCheck(req, res))) return;
  const sessionUser = await ensureSessionAuth(req, res);
  if (!sessionUser) return;

  const body = await readJsonBody(req);
  const displayName = normalizeDisplayName(body?.displayName);
  if (!displayName) {
    sendJson(res, 400, {
      error: {
        message: 'Display name must be 2-32 characters and use letters, numbers, spaces, periods, apostrophes, underscores, or hyphens.',
      },
    });
    return;
  }

  try {
    await firebaseAuth.updateUser(sessionUser.uid, { displayName });
    if (leaderboardPlayers) {
      await leaderboardPlayers.doc(sessionUser.uid).set(
        {
          displayName,
          updatedAt: new Date().toISOString(),
          email: FieldValue.delete(),
        },
        { merge: true },
      );
    }
    const user = await buildUserSummary(sessionUser.uid);
    sendJson(res, 200, { user });
  } catch (error) {
    console.error('[auth] Failed to update display name', error);
    sendJson(res, 500, { error: { message: 'Unable to update profile' } });
  }
};

export const handleLeaderboardSession = async (req, res) => {
  if (handleOptions(req, res, ['POST'])) return;
  if (!ensureMethod(req, res, ['POST'])) return;
  if (!ensureSameOrigin(req, res)) return;
  if (!ensureCsrf(req, res)) return;
  if (!(await ensureVerifiedAppCheck(req, res))) return;
  const sessionUser = await ensureSessionAuth(req, res);
  if (!sessionUser) return;
  if (!requireFirestoreConfigured(res)) return;

  const body = await readJsonBody(req);
  const { sessionStats, mode = 'standard', durationSec = 0, timerMinutes = 0 } = body;

  if (
    !sessionStats
    || typeof sessionStats.gross !== 'number'
    || typeof sessionStats.profit !== 'number'
    || typeof sessionStats.salesCount !== 'number'
  ) {
    sendJson(res, 400, { error: { message: 'Missing or invalid session stats' } });
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const playerRef = leaderboardPlayers.doc(sessionUser.uid);
    const updated = await firestore.runTransaction(async (transaction) => {
      const playerSnap = await transaction.get(playerRef);
      const existing = playerSnap.exists ? playerSnap.data() : {};
      const totalProfit = asNumber(existing.totalProfit) + sessionStats.profit;
      const totalGross = asNumber(existing.totalGross) + sessionStats.gross;
      const salesCount = asNumber(existing.salesCount) + sessionStats.salesCount;
      const bestVolumeProfit =
        mode === 'volume'
          ? Math.max(asNumber(existing.bestVolumeProfit), sessionStats.profit)
          : asNumber(existing.bestVolumeProfit);
      const record = {
        totalProfit,
        totalGross,
        salesCount,
        bestVolumeProfit,
        lastSessionProfit: sessionStats.profit,
        lastSessionGross: sessionStats.gross,
        lastSessionSales: sessionStats.salesCount,
        lastSessionAt: timestamp,
        updatedAt: timestamp,
        displayName: sessionUser.displayName || 'Player',
        email: FieldValue.delete(),
        mode,
      };
      transaction.set(playerRef, { ...existing, ...record }, { merge: true });
      return record;
    });

    await leaderboardSessions.add({
      uid: sessionUser.uid,
      mode,
      durationSec,
      timerMinutes,
      sessionStats,
      recordedAt: timestamp,
    });

    const limit = leaderboardLimitFromQuery(req);
    const leaderboard = await hydrateLeaderboard(limit);
    const me = {
      uid: sessionUser.uid,
      rank: await computePlayerRank(updated),
      ...updated,
    };

    sendJson(res, 200, { leaderboard, me });
  } catch (error) {
    console.error('[leaderboard] Failed to save session', error);
    sendJson(res, 500, { error: { message: 'Failed to sync leaderboard' } });
  }
};

export const handleLeaderboardTop = async (req, res) => {
  if (handleOptions(req, res, ['GET'])) return;
  if (!ensureMethod(req, res, ['GET'])) return;
  if (!requireFirestoreConfigured(res)) return;

  try {
    const leaderboard = await hydrateLeaderboard(leaderboardLimitFromQuery(req));
    sendJson(res, 200, { leaderboard });
  } catch (error) {
    console.error('[leaderboard] Failed to fetch top leaderboard', error);
    sendJson(res, 500, { error: { message: 'Failed to fetch leaderboard' } });
  }
};

export const handleLeaderboardMe = async (req, res) => {
  if (handleOptions(req, res, ['GET'])) return;
  if (!ensureMethod(req, res, ['GET'])) return;
  const sessionUser = await ensureSessionAuth(req, res);
  if (!sessionUser) return;
  if (!requireFirestoreConfigured(res)) return;

  try {
    const playerDoc = await leaderboardPlayers.doc(sessionUser.uid).get();
    if (!playerDoc.exists) {
      sendJson(res, 404, { me: null });
      return;
    }
    const me = normalizePlayerDoc(playerDoc);
    me.uid = sessionUser.uid;
    me.rank = await computePlayerRank(me);
    sendJson(res, 200, { me });
  } catch (error) {
    console.error('[leaderboard] Failed to fetch profile', error);
    sendJson(res, 500, { error: { message: 'Failed to fetch leaderboard profile' } });
  }
};
