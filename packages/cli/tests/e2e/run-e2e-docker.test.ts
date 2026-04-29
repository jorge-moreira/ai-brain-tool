import { describe, it, beforeAll, afterAll } from 'vitest'
import { execa } from 'execa'
import { readFileSync, existsSync } from 'fs'
import { parseFeatureFiles } from './utils/parse-feature-files'
import { TestResults } from './types/test-results'

// Parse feature files at module load time (auto-discovers all scenarios)
const featuresDir = './tests/e2e/features'
const allScenarios = parseFeatureFiles(featuresDir)

describe('E2E Tests', () => {
  let junitResults: TestResults | undefined

  beforeAll(async () => {
    // Build with cache
    await execa(
      'docker',
      ['compose', '-f', 'tests/e2e/docker-compose.e2e.yml', 'build', '--pull'],
      { reject: false, stdio: 'inherit' }
    )

    // Run tests
    await execa(
      'docker',
      ['compose', '-f', 'tests/e2e/docker-compose.e2e.yml', 'up', '--abort-on-container-exit'],
      { reject: false }
    )

    // Load JSON results
    const jsonPath = './tests/e2e/results/results.json'
    if (existsSync(jsonPath)) {
      const jsonContent = readFileSync(jsonPath, 'utf8')
      junitResults = JSON.parse(jsonContent) as TestResults
    }
  }, 300000)

  afterAll(async () => {
    await execa(
      'docker',
      ['compose', '-f', 'tests/e2e/docker-compose.e2e.yml', 'down', '--remove-orphans'],
      { reject: false }
    )
    await execa('docker', ['rmi', 'ai-brain-tool-cli-e2e-tests'], { reject: false })
  })

  // Group scenarios by feature for organized test output
  const features = [...new Set(allScenarios.map(s => s.featureName))]

  features.forEach(featureName => {
    describe(featureName, () => {
      const scenarios = allScenarios.filter(s => s.featureName === featureName)

      scenarios.forEach(({ scenarioName }) => {
        it(scenarioName, () => {
          if (!junitResults) {
            throw new Error('No test results available. Docker run may have failed.')
          }

          // Find ALL assertions for this scenario
          const assertions = junitResults.testResults
            .flatMap(file => file.assertionResults)
            .filter(
              test =>
                test.ancestorTitles[0]?.includes(featureName) &&
                test.ancestorTitles[1]?.includes(scenarioName)
            )

          if (assertions.length === 0) {
            throw new Error(`Scenario not found in results: ${scenarioName}`)
          }

          // Check if ANY assertion failed
          const failed = assertions.find(a => a.status === 'failed')
          if (failed) {
            // Read CLI output from file (written by spec files inside Docker)
            let cliOutput = ''
            const outputPath = './tests/e2e/results/last-output.txt'
            if (existsSync(outputPath)) {
              cliOutput = readFileSync(outputPath, 'utf8')
              // Extract just the ENOENT error (skip stack trace)
              const lines = cliOutput.split('\n')
              const enoentIdx = lines.findIndex(l => l.includes('ENOENT:'))
              if (enoentIdx >= 0) {
                cliOutput = lines.slice(enoentIdx, enoentIdx + 6).join('\n')
              }
            }
            throw new Error(`${scenarioName} failed:\n${cliOutput || failed.failureMessages[0]}`)
          }
        })
      })
    })
  })
})
