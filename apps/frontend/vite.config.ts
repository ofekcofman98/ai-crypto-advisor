import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // forks/threads pools both time-out spawning multiple workers on Windows paths
    // that contain spaces. maxWorkers: 1 caps concurrency to a single worker thread
    // while keeping the default module isolation (isolate: true) so each test file
    // gets its own clean module registry and RTL cleanup runs correctly.
    pool: 'threads',
    maxWorkers: 1,
  },
})
