import { describe, it, beforeAll, afterAll } from 'vitest'
import { execa } from 'execa'
import { readFileSync, existsSync } from 'fs'
import { parseFeatureFiles } from './utils/parse-feature-files'
import { TestResults } from './types/test-results'

const featuresDir = './tests/e2e/features'
const allSteps = parseFeatureFiles(featuresDir)

describe('E2E Tests', () => {
  let results: TestResults | undefined

  beforeAll(async () => {
    await execa(
      'docker',
      ['compose', '-f', 'tests/e2e/docker-compose.e2e.yml', 'build', '--pull'],
      { reject: false, stdio: 'inherit' }
    )

    await execa(
      'docker',
      ['compose', '-f', 'tests/e2e/docker-compose.e2e.yml', 'up', '--abort-on-container-exit'],
      { reject: false }
    )

    const jsonPath = './tests/e2e/results/results.json'
    if (existsSync(jsonPath)) {
      results = JSON.parse(readFileSync(jsonPath, 'utf8')) as TestResults
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

  const features = [...new Set(allSteps.map(s => s.featureName))]

  features.forEach(featureName => {
    describe(featureName, () => {
      const scenarios = [
        ...new Set(allSteps.filter(s => s.featureName === featureName).map(s => s.scenarioName))
      ]

      scenarios.forEach(scenarioName => {
        describe(scenarioName, () => {
          const steps = allSteps.filter(
            s => s.featureName === featureName && s.scenarioName === scenarioName
          )

          steps.forEach(({ stepName }) => {
            it(stepName, () => {
              if (!results) {
                throw new Error('No test results available. Docker run may have failed.')
              }

              const assertion = results.testResults
                .flatMap(f => f.assertionResults)
                .find(
                  a =>
                    a.ancestorTitles[0] === `Feature: ${featureName}` &&
                    a.ancestorTitles[1] === `Scenario: ${scenarioName}` &&
                    a.title === stepName
                )

              if (!assertion) {
                throw new Error(`Step not found in results: ${stepName}`)
              }

              if (assertion.status === 'failed') {
                throw new Error(`${stepName} failed:\n${assertion.failureMessages[0]}`)
              }
            })
          })
        })
      })
    })
  })
})
