# Security & Access Control

## Password Protection

This project includes password protection for the development server to prevent unauthorized access when sharing your local server with others.

## Setup

1. **Set Your Password**
   - Open `.env.local` (already created)
   - Change `VITE_ACCESS_PASSWORD` to your desired password
   - Example: `VITE_ACCESS_PASSWORD=MySecurePass123!`

2. **Configure AI API URL** (if using AI features)
   - Open `.env.local`
   - Update `VITE_AI_API_URL` with your ngrok tunnel URL
   - Example: `VITE_AI_API_URL=https://abc123.ngrok-free.app/v1`
   - **When AI is OFF**: Set to empty string or comment out: `# VITE_AI_API_URL=`
   - **When AI is ON**: Update with your current ngrok URL
   - **Note**: You need to restart the dev server after changing this

3. **Run the Dev Server**
   ```bash
   npm run dev
   ```

4. **Access the Server**
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

⚠️ **This is basic protection, not enterprise-grade security**
- Use HTTPS in production
- Don't use this password anywhere else
- Change the password regularly
- The password is sent in plaintext over HTTP (fine for local network)

## Disable Password Protection

To disable password protection (for solo local development):
- Remove or empty the `VITE_ACCESS_PASSWORD` in `.env.local`
- Restart the dev server

## Rate Limiting (Optional)

To prevent overload, consider:
1. Limiting the number of concurrent users
2. Setting up a reverse proxy with rate limiting (nginx, Caddy)
3. Using a cloud service if you need many users

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
