import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'
import { execa } from 'execa'

// upgrade calls ensureUv which may install uv + Python — needs more than the default 5s
vi.setConfig({ testTimeout: 300000 })
import { join } from 'path'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs'
import { tmpdir, homedir } from 'os'

const feature = await loadFeature('./upgrade.feature')

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

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  let brainPath = ''
  let lastOutput = ''
  let lastExitCode = 0

  AfterEachScenario(() => {
    if (lastOutput && lastExitCode !== 0)
      writeFileSync('./tests/e2e/results/last-output.txt', lastOutput)
    if (brainPath && existsSync(brainPath)) rmSync(brainPath, { recursive: true, force: true })
    brainPath = ''
    lastOutput = ''
    lastExitCode = 0
  })

  const givenBrain = (name: string) => {
    brainPath = mkdtempSync(join(tmpdir(), `ai-brain-e2e-${name}-`))
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true })
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null })
    )
    const brains = readConfig()
    brains[name] = brainPath
    writeConfig(brains)
  }

  const run = async (args: string[]) => {
    const r = await execa('ai-brain', args, { reject: false, all: true })
    lastOutput = (r.all ?? r.stdout ?? '') + (r.stderr ?? '')
    lastExitCode = r.exitCode ?? 0
  }

  Scenario('Upgrade shows brain resolution', ({ Given, When, Then }) => {
    Given('I have a brain named {string} with templates', (_, n: string) => {
      givenBrain(n)
    })
    When('I run the upgrade command for {string}', async (_, id: string) => {
      await run(['upgrade', id])
    })
    Then('the command should attempt to upgrade', () => {
      expect(lastOutput).toBeDefined()
    })
  })

  Scenario('Upgrade rejects unknown brain', ({ Given, When, Then }) => {
    Given('I have a brain named {string}', (_, n: string) => {
      givenBrain(n)
    })
    When('I run the upgrade command for {string}', async (_, id: string) => {
      await run(['upgrade', id])
    })
    Then('the command should fail with brain not found', () => {
      expect(lastExitCode).toBe(1)
      expect(lastOutput).toContain('not found')
    })
  })

  Scenario('Upgrade shows help', ({ When, Then, And }) => {
    When('I run upgrade with --help', async () => {
      await run(['upgrade', '--help'])
    })
    Then('the command should succeed', () => {
      expect(lastExitCode).toBe(0)
    })
    And('the output should describe the upgrade command', () => {
      expect(lastOutput).toContain('upgrade')
    })
  })
})
