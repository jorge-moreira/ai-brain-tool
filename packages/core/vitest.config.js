import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    reporters: ['default', 'junit', 'github-actions'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/__tests__/**', '**/*.test.ts'],
      enabled: false
    }
  },
  esbuild: {
    target: 'node24'
  }
})
