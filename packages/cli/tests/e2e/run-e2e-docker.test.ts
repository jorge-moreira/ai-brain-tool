import { describe, it, beforeAll } from 'vitest'
import { execa } from 'execa'
import { readFileSync, existsSync } from 'fs'
import { XMLParser } from 'fast-xml-parser'

interface JUnitResults {
  testsuites?: {
    testsuite?: Array<{
      name?: string
      testcase?: Array<{ name?: string; failure?: unknown }>
    }>
  }
}

describe('E2E Tests (Docker)', () => {
  let junitResults: JUnitResults | undefined

  beforeAll(async () => {
    // Run Docker once for all tests
    await execa(
      'docker',
      [
        'compose',
        '-f',
        'tests/e2e/docker-compose.e2e.yml',
        'up',
        '--build',
        '--abort-on-container-exit',
        '--exit-code-from',
        'e2e'
      ],
      {
        reject: false
      }
    )

    // Read JUnit results
    const junitPath = './tests/e2e/results/junit.xml'
    if (existsSync(junitPath)) {
      const junitContent = readFileSync(junitPath, 'utf8')
      const parser = new XMLParser({ ignoreAttributes: false })
      junitResults = parser.parse(junitContent) as JUnitResults
    }
  }, 300000) // 5 min timeout for Docker build

  // Setup Feature Tests
  it('Setup - Fresh setup creates brain folder', () => {
    assertTestPassed('Setup Command', 'Fresh setup creates brain folder')
  })

  it('Setup - Setup registers brain in config', () => {
    assertTestPassed('Setup Command', 'Setup registers brain in config')
  })

  it('Setup - List shows configured brains', () => {
    assertTestPassed('Setup Command', 'List shows configured brains')
  })

  it('Setup - Status shows brain information', () => {
    assertTestPassed('Setup Command', 'Status shows brain information')
  })

  // Multi-Brain Feature Tests
  it('Multi-Brain - Create multiple brains', () => {
    assertTestPassed('Multi-Brain Management', 'Create multiple brains')
  })

  it('Multi-Brain - List shows all brains', () => {
    assertTestPassed('Multi-Brain Management', 'List shows all brains')
  })

  it('Multi-Brain - Status with specific brain-id', () => {
    assertTestPassed('Multi-Brain Management', 'Status with specific brain-id')
  })

  it('Multi-Brain - Auto-detect brain from current directory', () => {
    assertTestPassed('Multi-Brain Management', 'Auto-detect brain from current directory')
  })

  function assertTestPassed(featureName: string, scenarioName: string): void {
    if (!junitResults?.testsuites?.testsuite) {
      throw new Error('No JUnit results available. Docker run may have failed.')
    }

    const testSuite = junitResults.testsuites.testsuite.find(s => s.name?.includes(featureName))

    if (!testSuite) {
      throw new Error(`Feature not found: ${featureName}`)
    }

    const testCase = testSuite.testcase?.find(t => t.name?.includes(scenarioName))

    if (!testCase) {
      throw new Error(`Scenario not found: ${scenarioName}`)
    }

    if (testCase.failure) {
      const failureMsg = Array.isArray(testCase.failure)
        ? JSON.stringify(testCase.failure[0])
        : JSON.stringify(testCase.failure)
      throw new Error(`E2E test failed: ${scenarioName}\n${failureMsg}`)
    }
  }
})
