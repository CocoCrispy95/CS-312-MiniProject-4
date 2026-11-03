import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, React runs on :5173 and forwards /api calls to the
// Node backend on :8000, so the session cookie works without CORS setup.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
