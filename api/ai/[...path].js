import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const config = { runtime: 'edge' };

const aiServerUrl = process.env.AI_SERVER_URL;
const aiServerApiKey = process.env.AI_SERVER_API_KEY || '';
const rateWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const rateMax = Number(process.env.AI_RATE_LIMIT_MAX || 250);
const rateWindowSeconds = Math.max(1, Math.ceil(rateWindowMs / 1000));

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(rateMax, `${rateWindowSeconds} s`),
  analytics: true,
});

const getClientIp = (request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const vercel = request.headers.get('x-vercel-forwarded-for');
  if (vercel) return vercel.split(',')[0].trim();
  return 'unknown';
};

const buildTargetUrl = (request) => {
  const base = (aiServerUrl || '').replace(/\/+$/, '');
  const incoming = new URL(request.url);
  const stripped = incoming.pathname.replace(/^\/api\/ai/, '');
  const normalized = stripped ? stripped : '';
  return new URL(`${base}${normalized}${incoming.search}`);
};

const filterHeaders = (headers) => {
  const filtered = new Headers(headers);
  filtered.delete('host');
  filtered.delete('content-length');
  if (aiServerApiKey) {
    filtered.set('authorization', `Bearer ${aiServerApiKey}`);
  }
  return filtered;
};

export default async function handler(request, context) {
  if (!aiServerUrl) {
    return new Response(JSON.stringify({ error: { message: 'AI server not configured' } }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  const ip = getClientIp(request);
  const { success, limit, remaining, reset } = await ratelimit.limit(`ai:${ip}`);

  if (!success) {
    return new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-limit': limit.toString(),
        'x-ratelimit-remaining': remaining.toString(),
        'x-ratelimit-reset': reset.toString(),
      },
    });
  }

  const targetUrl = buildTargetUrl(request);
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: filterHeaders(request.headers),
    body,
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set('x-ratelimit-limit', limit.toString());
  responseHeaders.set('x-ratelimit-remaining', remaining.toString());
  responseHeaders.set('x-ratelimit-reset', reset.toString());

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
