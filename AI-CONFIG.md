# AI Configuration Quick Guide

## Quick Steps to Update AI URL

### When Starting ngrok Tunnel

1. Start your ngrok tunnel (get the URL)
2. Open `.env.local`
3. Update the line:
   ```bash
   VITE_AI_API_URL=https://YOUR-NEW-NGROK-URL.ngrok-free.app/v1
   ```
4. Restart the dev server:
   ```bash
   npm run dev
   ```

### When Turning AI Off

1. Open `.env.local`
2. Comment out or empty the line:
   ```bash
   # VITE_AI_API_URL=
   ```
   Or:
   ```bash
   VITE_AI_API_URL=
   ```
3. Restart the dev server

## Current Configuration

Your AI URL is currently set to:
```
https://e5e3db2e421c.ngrok-free.app/v1
```

## Checking Current Settings

The AI URL is loaded from `.env.local` when the dev server starts. To see what's currently configured:

```bash
cat .env.local | grep VITE_AI_API_URL
```

## Troubleshooting

**Problem**: Changed `.env.local` but app still uses old URL
- **Solution**: Restart the dev server (`Ctrl+C`, then `npm run dev`)

**Problem**: AI requests failing
- **Solution**:
  1. Check if your ngrok tunnel is still running
  2. Verify the URL in `.env.local` matches your ngrok URL
  3. Make sure the URL ends with `/v1`
  4. Restart the dev server

**Problem**: Want to use local LM Studio instead
- **Solution**: Set `VITE_AI_API_URL=/api/lm-studio` in `.env.local`

## Default Behavior

If `VITE_AI_API_URL` is not set or empty, the app defaults to:
- `/api/lm-studio` (proxied to `http://127.0.0.1:1234/v1`)

This allows local-only AI with LM Studio running on port 1234.
