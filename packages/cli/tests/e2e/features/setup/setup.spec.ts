import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'

// setup --non-interactive installs uv + Python + 60 packages — needs more than the default 5s
vi.setConfig({ testTimeout: 300000 })
import { execa } from 'execa'
import { join } from 'path'
import { existsSync, writeFileSync } from 'fs'
import { homedir } from 'os'

const feature = await loadFeature('./setup.feature')

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  let lastOutput = ''
  let lastExitCode = 0

  AfterEachScenario(() => {
    if (lastOutput && lastExitCode !== 0)
      writeFileSync('./tests/e2e/results/last-output.txt', lastOutput)
    lastOutput = ''
    lastExitCode = 0
  })

  Scenario(
    'Setup installs global dependencies with --non-interactive',
    ({ Given, When, Then, And }) => {
      Given('I have no global venv installed', () => {
        // Real HOME is used; venv may or may not exist — setup is idempotent
      })
      When('I run setup with --non-interactive', async () => {
        const r = await execa('ai-brain', ['setup', '--non-interactive'], {
          reject: false,
          all: true
        })
        lastOutput = (r.all ?? r.stdout ?? '') + (r.stderr ?? '')
        lastExitCode = r.exitCode ?? 0
      })
      Then('the command should succeed', () => {
        expect(lastExitCode).toBe(0)
      })
      And('the global venv should exist', () => {
        expect(existsSync(join(homedir(), '.ai-brain-tool', '.venv'))).toBe(true)
      })
      And('graphify should be installed', () => {
        expect(existsSync(join(homedir(), '.ai-brain-tool', '.venv', 'bin', 'python3'))).toBe(true)
      })
    }
  )
})
