import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // forks pool uses child_process.fork() which breaks on Windows paths with spaces.
    // threads pool uses Worker Threads and handles the path correctly.
    pool: 'threads',
  },
})
