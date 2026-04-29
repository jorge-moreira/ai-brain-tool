import { describe, it, beforeAll, afterAll } from 'vitest'
import { execa } from 'execa'
import { readFileSync, existsSync } from 'fs'
import { TestResults } from './types/test-results'
import { parseFeatureFiles } from './utils/parse-feature-files'

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

          // Find matching test in results
          const testCase = junitResults.testResults
            .flatMap(file => file.assertionResults)
            .find(
              test =>
                test.ancestorTitles[0]?.includes(featureName) &&
                test.ancestorTitles[1]?.includes(scenarioName)
            )

          if (!testCase) {
            throw new Error(`Scenario not found in results: ${scenarioName}`)
          }

          if (testCase.status === 'failed') {
            throw new Error(`${scenarioName} failed:\n${testCase.failureMessages[0]}`)
          }
        })
      })
    })
  })
})
