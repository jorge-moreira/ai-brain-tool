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
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/__tests__/**', '**/*.test.ts', 'src/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
})
