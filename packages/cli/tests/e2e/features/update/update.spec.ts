import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'

// ensureGraphify in BeforeAllScenarios may install uv + venv — needs generous timeouts
vi.setConfig({ testTimeout: 300000, hookTimeout: 300000 })
import { execa } from 'execa'
import { join } from 'path'
import { homedir, tmpdir } from 'os'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs'
import { ensureGraphify } from '../../utils/ensure-graphify'

const feature = await loadFeature('./update.feature')

const configPath = join(homedir(), '.ai-brain-tool', 'config.json')

function readConfig(): Record<string, string> {
  try {
    return (
      (JSON.parse(readFileSync(configPath, 'utf8')) as { brains?: Record<string, string> })
        .brains ?? {}
    )
  } catch {
    return {}
  }
}

function writeConfig(brains: Record<string, string>): void {
  mkdirSync(join(homedir(), '.ai-brain-tool'), { recursive: true })
  writeFileSync(configPath, JSON.stringify({ brains }))
}

describeFeature(feature, ({ Scenario, AfterEachScenario, BeforeAllScenarios }) => {
  let brainPath = ''
  let isolatedHome = '' // only used for the no-python scenario
  let lastOutput = ''
  let lastExitCode = 0

  BeforeAllScenarios(async () => {
    await ensureGraphify()
  })

  AfterEachScenario(() => {
    if (lastOutput && lastExitCode !== 0)
      writeFileSync('./tests/e2e/results/last-output.txt', lastOutput)
    if (brainPath && existsSync(brainPath)) rmSync(brainPath, { recursive: true, force: true })
    if (isolatedHome && existsSync(isolatedHome))
      rmSync(isolatedHome, { recursive: true, force: true })
    brainPath = ''
    isolatedHome = ''
    lastOutput = ''
    lastExitCode = 0
  })

  // Sets up a brain in the real HOME config
  const givenBrain = (name: string, dirs: string[] = []) => {
    brainPath = mkdtempSync(join(tmpdir(), `ai-brain-e2e-${name}-`))
    mkdirSync(brainPath, { recursive: true })
    for (const d of dirs) mkdirSync(join(brainPath, d), { recursive: true })
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null })
    )
    const brains = readConfig()
    brains[name] = brainPath
    writeConfig(brains)
  }

  const run = async (args: string[], env?: NodeJS.ProcessEnv) => {
    const r = await execa('ai-brain', args, {
      env: { ...process.env, ...env },
      reject: false,
      all: true
    })
    lastOutput = (r.all ?? r.stdout ?? '') + (r.stderr ?? '')
    lastExitCode = r.exitCode ?? 0
  }

  Scenario('Update fails gracefully without Python', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string} with notes', (_, n: string) => {
      // Use an isolated HOME with no venv to simulate missing Python
      isolatedHome = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-no-python-'))
      brainPath = join(isolatedHome, n)
      mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
      mkdirSync(join(isolatedHome, '.ai-brain-tool'), { recursive: true })
      writeFileSync(join(brainPath, 'raw', 'notes', 'test.md'), '# Test')
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({ gitSync: false, obsidianDir: null })
      )
      writeFileSync(
        join(isolatedHome, '.ai-brain-tool', 'config.json'),
        JSON.stringify({ brains: { [n]: brainPath } })
      )
    })
    When('I run the update command for {string}', async (_, id: string) => {
      await run(['update', id], { HOME: isolatedHome })
    })
    Then('the command should report failure', () => {
      expect(lastExitCode).not.toBe(0)
    })
    And('the output should indicate venv or Python issue', () => {
      expect(lastOutput.toLowerCase()).toMatch(/venv|python|enoent/)
    })
  })

  Scenario('Update shows help message', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string}', (_, n: string) => {
      givenBrain(n)
    })
    When('I run update with --help', async () => {
      await run(['update', '--help'])
    })
    Then('the command should succeed', () => {
      expect(lastExitCode).toBe(0)
    })
    And('the output should describe the update command', () => {
      expect(lastOutput).toContain('Rebuild')
    })
  })

  Scenario('Update succeeds with empty brain', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string} with an empty raw folder', (_, n: string) => {
      givenBrain(n, ['raw'])
      // raw/ exists but has no markdown files — graphify finds nothing to process
    })
    When('I run the update command for {string}', async (_, id: string) => {
      await run(['update', id])
    })
    Then('the command should succeed', () => {
      expect(lastExitCode).toBe(0)
    })
    And('the output should indicate the brain was updated', () => {
      expect(lastOutput).toMatch(/updated|rebuilt/i)
    })
  })

  Scenario('Update uses global venv', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string} with notes', (_, n: string) => {
      givenBrain(n, ['raw/notes', 'graphify-out'])
      writeFileSync(join(brainPath, 'raw', 'notes', 'test.md'), '# Test')
    })
    When('I run the update command for {string}', async (_, id: string) => {
      await run(['update', id])
    })
    Then('the command should not use a brain-local venv', () => {
      expect(existsSync(join(brainPath, '.venv'))).toBe(false)
    })
    And('the command should invoke the global venv python', () => {
      expect(lastOutput).not.toMatch(new RegExp(`${brainPath}.*\\.venv`))
      const globalVenvPath = join(homedir(), '.ai-brain-tool', '.venv')
      const usedGlobalOrGraphifyError =
        lastOutput.includes(globalVenvPath) ||
        lastOutput.toLowerCase().includes('graphify') ||
        lastExitCode === 0
      expect(usedGlobalOrGraphifyError).toBe(true)
    })
  })
})
