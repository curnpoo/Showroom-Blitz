import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
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
  plugins: [
    react(),
    basicAuthPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['*.png', 'Assets/*.webp', 'Assets/*.mp4'],
      manifest: {
        name: 'Showroom Blitz',
        short_name: 'Showroom Blitz',
        description: 'Master the art of car sales in this fast-paced dealership simulator!',
        theme_color: '#1e3a5f',
        background_color: '#1e3a5f',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,mp4,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB (for video + large images)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Allow external connections
    proxy: {
      '/api/ai': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
      },
      '/api/leaderboard': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
      },
    }
  }
})
