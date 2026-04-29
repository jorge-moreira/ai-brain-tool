import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.spec.ts'],
    timeout: 120000,
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: 'tests/e2e/results/junit.xml'
    },
    environment: 'node',
    coverage: {
      enabled: false
    }
  }
})
