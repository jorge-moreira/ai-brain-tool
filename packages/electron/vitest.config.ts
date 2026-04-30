import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setupTests.ts'],
    reporters: ['default', 'junit'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/*.test.ts', '**/*.test.tsx']
    },
    deps: {
      inline: ['@ai-brain/ui']
    }
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@ai-brain/ui': path.resolve(__dirname, '../ui/src'),
      '@ai-brain/core': path.resolve(__dirname, '../core/src'),
      '@/lib/utils': path.resolve(__dirname, '../ui/src/lib/utils'),
      '@': path.resolve(__dirname, './src')
    }
  }
})
