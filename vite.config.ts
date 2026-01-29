import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Basic HTTP authentication middleware
function basicAuthPlugin(): Plugin {
  const password = process.env.VITE_ACCESS_PASSWORD || '';

  return {
    name: 'basic-auth',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Skip auth if no password is set (local dev convenience)
        if (!password) {
          return next();
        }

        // Check for Basic Auth header
        const auth = req.headers.authorization;

        if (!auth || !auth.startsWith('Basic ')) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Showroom Blitz"');
          res.statusCode = 401;
          res.end('Authentication required');
          return;
        }

        // Decode and verify credentials
        const credentials = Buffer.from(auth.slice(6), 'base64').toString();
        const [_username, providedPassword] = credentials.split(':');

        if (providedPassword === password) {
          return next();
        }

        // Invalid credentials
        res.setHeader('WWW-Authenticate', 'Basic realm="Showroom Blitz"');
        res.statusCode = 401;
        res.end('Invalid credentials');
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicAuthPlugin()],
  server: {
    host: true, // Allow external connections
    proxy: {
      '/api/ai': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
      }
    }
  }
})
