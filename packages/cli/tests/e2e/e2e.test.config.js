import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.spec.ts'],
    // Run spec files serially to prevent concurrent uv pip install panics (exit 101)
    maxWorkers: 1,
    minWorkers: 1,
    sequence: {
      files: [
        'tests/e2e/features/setup/setup.spec.ts',
        'tests/e2e/features/list/list.spec.ts',
        'tests/e2e/features/status/status.spec.ts',
        'tests/e2e/features/update/update.spec.ts',
        'tests/e2e/features/upgrade/upgrade.spec.ts',
        'tests/e2e/features/templates/templates.spec.ts',
        'tests/e2e/features/multi-brain/multi-brain.spec.ts',
        'tests/e2e/features/obsidian/obsidian.spec.ts',
      ]
    },
    timeout: 120000,
    reporters: ['verbose', 'junit', 'json'],
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
