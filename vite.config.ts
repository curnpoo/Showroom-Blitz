import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/lm-studio': {
        target: 'http://127.0.0.1:1234/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lm-studio/, ''),
      }
    }
  }
})
