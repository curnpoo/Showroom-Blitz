# AI Configuration Quick Guide

This app uses a private proxy so the AI server URL never ships to the browser bundle.

## Setup (Local Server)

1. Copy `.env.example` to `.env.local`
2. Set:
   ```bash
   AI_SERVER_URL=https://your-private-ai-server.example.com/v1
   AI_SERVER_API_KEY=optional
   AI_CLIENT_KEY=optional
   AI_RATE_LIMIT_WINDOW_MS=3600000
   AI_RATE_LIMIT_MAX=250
   UPSTASH_REDIS_REST_URL=optional
   UPSTASH_REDIS_REST_TOKEN=optional
   ```
3. Start the local proxy server:
   ```bash
   npm run dev:server
   ```

## Setup (Client)

Run the Vite dev server as usual:
```bash
npm run dev
```

The client calls the proxy at `/api/ai`, which forwards to `AI_SERVER_URL`.

## Setup (Vercel)

1. Add these environment variables in Vercel:
   - `AI_SERVER_URL`
   - `AI_SERVER_API_KEY` (optional)
   - `AI_CLIENT_KEY` (optional, required if you want to lock down public access)
   - `AI_RATE_LIMIT_WINDOW_MS`
   - `AI_RATE_LIMIT_MAX`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
2. Deploy as usual. The Edge function at `/api/ai/*` will proxy requests.

## Notes

- The AI base URL is no longer stored in the frontend or GitHub.
- If you set `AI_CLIENT_KEY`, the proxy requires `Authorization: Bearer <key>` (or `X-AI-Client-Key`).
- Rate limiting is enforced in the proxy and can be tuned via env vars.
