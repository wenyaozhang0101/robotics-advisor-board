import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: { sourcemap: false },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', '**/node_modules/**', 'dist/**'],
    coverage: { reporter: ['text', 'html'] },
  },
})
