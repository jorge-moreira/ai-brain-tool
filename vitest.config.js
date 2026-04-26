import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'coverage/junit.xml'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.js',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});