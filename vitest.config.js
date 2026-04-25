import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html', 'lcov', 'json-summary'],
    reportsDirectory: 'coverage',
    exclude: [
      'bin/**',
      'tests/**',
      '**/*.test.js',
      '**/*.spec.js',
      '**/setup.js',
      '**/mcp/**',
    ],
  },
})