# Security & Access Control

## Password Protection

This project includes password protection for the development server to prevent unauthorized access when sharing your local server with others.

## Setup

1. **Set Your Password**
   - Open `.env.local` (already created)
   - Change `VITE_ACCESS_PASSWORD` to your desired password
   - Example: `VITE_ACCESS_PASSWORD=MySecurePass123!`

2. **Configure AI Server Proxy** (if using AI features)
   - Open `.env.local`
   - Set `AI_SERVER_URL` to your private AI server URL
   - Optional: set `AI_SERVER_API_KEY`, `AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX`
   - **Note**: Restart the proxy server after changing this

3. **Run the Dev Server**
   ```bash
   npm run dev
   ```

4. **Run the AI Proxy (if AI is on)**
   ```bash
   npm run dev:server
   ```

5. **Access the Server**
   - When someone visits your server URL, they'll see a browser login prompt
   - **Username**: Can be anything (ignored)
   - **Password**: The password you set in `.env.local`

## Sharing Access

When sharing your local server with others:

1. **Get your local IP address:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. **Share the URL format:**
   ```
   http://YOUR-IP-ADDRESS:5173
   ```
   Example: `http://192.168.1.100:5173`

3. **Give them the password** from your `.env.local` file

## Important Security Notes

⚠️ **The Vite password gate is only a convenience layer for local sharing**
- Use HTTPS in production
- Don't use this password anywhere else
- Change the password regularly
- The password is sent in plaintext over HTTP (fine for local network)

## Firebase Auth Security

The app now expects:
- Firebase Admin credentials on the server for session-cookie verification
- Firebase App Check for sign-in/profile/session-write routes
- Firestore access to be denied directly from clients via `firestore.rules`

Recommended production posture:
- Keep `VITE_FIREBASE_*` client config in env vars only
- Keep Admin credentials server-side only
- Use the App Check site key plus an allowlist in `ALLOWED_WEB_ORIGINS`
- Prefer `VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN` only for local debugging, never production
- Make sure the Firebase Admin service account can use the target Google Cloud project. For Vercel session-cookie auth, grant it `Service Usage Consumer` on the project used by `identitytoolkit.googleapis.com`.

## Disable Password Protection

To disable password protection (for solo local development):
- Remove or empty the `VITE_ACCESS_PASSWORD` in `.env.local`
- Restart the dev server

## Rate Limiting

The AI proxy includes built-in rate limiting. Tune via:
- `AI_RATE_LIMIT_WINDOW_MS`
- `AI_RATE_LIMIT_MAX`

## Vercel Deployments

When deploying on Vercel:
- The `/api/ai/*` Edge function handles proxying.
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for global rate limiting.

## Firewall Recommendations

For better security:
- Only allow connections from trusted IP addresses
- Use a VPN for remote access
- Consider using ngrok or similar for external access with better security

## Alternative: Using Ngrok (Recommended for External Sharing)

For sharing outside your local network with better security:

1. **Install ngrok:** https://ngrok.com/download

2. **Run your dev server:**
   ```bash
   npm run dev
   ```

3. **Create a tunnel with auth:**
   ```bash
   ngrok http 5173 --basic-auth="username:password"
   ```

4. **Share the ngrok URL** - it will look like `https://abc123.ngrok.io`

Benefits:
- HTTPS encryption
- No need to expose your home IP
- Built-in rate limiting
- Better firewall protection
