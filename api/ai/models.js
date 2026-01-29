import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const config = { runtime: 'edge' };

const aiServerUrl = process.env.AI_SERVER_URL;
const aiServerApiKey = process.env.AI_SERVER_API_KEY || '';
const aiClientKey = process.env.AI_CLIENT_KEY || '';
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-AI-Client-Key',
};

const getClientKey = (request) => {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const headerKey = request.headers.get('x-ai-client-key');
  if (headerKey) return headerKey.trim();
  return '';
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!aiServerUrl) {
    return new Response(JSON.stringify({ error: { message: 'AI server not configured' } }), {
      status: 503,
      headers: { 'content-type': 'application/json', ...corsHeaders },
    });
  }

  if (aiClientKey) {
    const clientKey = getClientKey(request);
    if (clientKey !== aiClientKey) {
      return new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
        status: 401,
        headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }
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
        ...corsHeaders,
      },
    });
  }

  const targetUrl = `${aiServerUrl.replace(/\/+$/, '')}/models`;

  const upstream = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${aiServerApiKey}`,
    },
  });

  const responseHeaders = new Headers();
  responseHeaders.set('content-type', 'application/json');
  responseHeaders.set('x-ratelimit-limit', limit.toString());
  responseHeaders.set('x-ratelimit-remaining', remaining.toString());
  responseHeaders.set('x-ratelimit-reset', reset.toString());
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
