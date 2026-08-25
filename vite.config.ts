/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    watch: {
      // WSL /mnt/c (drvfs/9p) does not deliver inotify events, so Vite's
      // default watcher never sees edits and the browser keeps serving a
      // stale module graph (HMR silently dead). Polling restores HMR.
      usePolling: true,
      interval: 500,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      thresholds: { lines: 80 }
    }
  }
})
