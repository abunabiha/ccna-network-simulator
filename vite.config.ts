import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    cors: true,
    open: false,
    watch: {
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      },
      ignored: [
        '**/CCTV/**',
        '**/.git/**',
        '**/dist/**',
        '**/.tmp/**',
        '**/scripts/**',
        '**/.user_uploaded/**',
        '**/.system_generated/**',
        '**/.DS_Store',
        '**/*.log',
        '**/*.mp4',
        '**/*.jpg',
        '**/*.png',
        '**/*.pt',
        '**/docs/**',
        '**/node_modules/**'
      ]
    }
  }
});
