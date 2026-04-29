import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    reporters: ['default', 'junit', 'github-actions'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/e2e/run-e2e-docker.test.ts'  // E2E wrapper test
    ],
    exclude: [
      'tests/e2e/**/*.spec.ts',  // Cucumber tests run separately in Docker
      'tests/e2e/step-definitions/**',
      'tests/e2e/features/**',
      'tests/e2e/shared/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/__tests__/**', '**/*.test.ts', 'src/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      enabled: false
    }
  }
})
