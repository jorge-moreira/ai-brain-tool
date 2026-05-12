export interface TestResult {
  title: string
  ancestorTitles: string[]
  status: 'passed' | 'failed'
  failureMessages: string[]
}

export interface TestFileResult {
  assertionResults: TestResult[]
  name: string
}

export interface TestResults {
  success: boolean
  testResults: TestFileResult[]
}
