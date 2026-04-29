import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.spec.ts'],
    timeout: 120000,
    reporters: ['junit', 'json'],
    outputFile: {
      junit: 'tests/e2e/results/junit.xml',
      json: 'tests/e2e/results/results.json'
    },
    environment: 'node',
    coverage: {
      enabled: false
    }
  }
})
