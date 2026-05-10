import { E2EContext } from '../../types/e2e-context'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs'
import { tmpdir, homedir } from 'os'
import { Config } from '@ai-brain/core/config'

const feature = await loadFeature('./multi-brain.feature')

const configPath = join(homedir(), '.ai-brain-tool', 'config.json')

function readConfig(): Config {
  try {
    return JSON.parse(readFileSync(configPath, 'utf8')) as Config
  } catch {
    return { brains: {}, installationComplete: false, graphifyyExtras: [], aiTools: [] }
  }
}

function writeConfig(config: Config): void {
  mkdirSync(join(homedir(), '.ai-brain-tool'), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config))
}

// Track all brain paths created in this run so we can clean them up
const createdBrainPaths: string[] = []

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  const ctx: E2EContext = { brainPath: '', lastOutput: '', lastExitCode: 0 }

  AfterEachScenario(() => {
    if (ctx.lastOutput && ctx.lastExitCode !== 0)
      writeFileSync('./tests/e2e/results/last-output.txt', ctx.lastOutput)
    for (const p of createdBrainPaths) {
      if (existsSync(p)) rmSync(p, { recursive: true, force: true })
    }
    createdBrainPaths.length = 0
    ctx.brainPath = ''
    ctx.lastOutput = ''
    ctx.lastExitCode = 0
  })

  const setupBrain = (brainName: string): string => {
    const brainPath = mkdtempSync(join(tmpdir(), `ai-brain-e2e-${brainName}-`))
    mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null })
    )
    const config = readConfig()
    config.brains[brainName] = brainPath
    writeConfig(config)
    createdBrainPaths.push(brainPath)
    return brainPath
  }

  Scenario('Create multiple brains', ({ Given, When, Then, And }) => {
    Given('I am on a fresh machine', () => {
      // Reset config to simulate fresh state
      writeConfig({ brains: {}, installationComplete: false, graphifyyExtras: [], aiTools: [] })
    })

    When('I run setup for brain {string}', (_, brainName: string) => {
      setupBrain(brainName)
    })

    And('I run setup for brain {string}', (_, brainName: string) => {
      setupBrain(brainName)
    })

    Then('I should have two brains configured', () => {
      const config = readConfig()
      expect(Object.keys(config.brains).length).toBe(2)
    })
  })

  Scenario('List shows all brains', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string}', (_, brainName: string) => {
      ctx.brainPath = setupBrain(brainName)
    })

    And('I have a brain named {string}', (_, brainName: string) => {
      setupBrain(brainName)
    })

    When('I run the list command', async () => {
      const result = await execa('ai-brain', ['list'], { reject: false, all: true })
      ctx.lastOutput = result.all ?? result.stdout ?? ''
      ctx.lastExitCode = result.exitCode ?? 0
    })

    Then('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })

    And('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })
  })

  Scenario('Status with specific brain-id', ({ Given, When, Then }) => {
    Given('I have a brain named {string}', (_, brainName: string) => {
      ctx.brainPath = setupBrain(brainName)
    })

    When('I run status with --brain-id work-brain', async () => {
      const result = await execa('ai-brain', ['status', '--brain-id', 'work-brain'], {
        reject: false,
        all: true
      })
      ctx.lastOutput = result.all ?? result.stdout ?? ''
      ctx.lastExitCode = result.exitCode ?? 0
    })

    Then('the output should show work-brain path', () => {
      expect(ctx.lastOutput).toContain('work-brain')
    })
  })

  Scenario('Auto-detect brain from current directory', ({ Given, And, When, Then }) => {
    Given('I have a brain at {string}', (_, _brainPath: string) => {
      // brainPath arg from feature is illustrative; we create a real one
      ctx.brainPath = setupBrain('test-brain')
    })

    And('I am inside the test-brain folder', () => {
      // ctx.brainPath is already set to test-brain path
    })

    When('I run status without --brain-id', async () => {
      const result = await execa('ai-brain', ['status'], {
        cwd: ctx.brainPath,
        reject: false,
        all: true
      })
      ctx.lastOutput = result.all ?? result.stdout ?? ''
      ctx.lastExitCode = result.exitCode ?? 0
    })

    Then('it should auto-detect and show test-brain status', () => {
      expect(ctx.lastOutput).toContain('Brain path:')
      expect(ctx.lastOutput).toContain('test-brain')
    })
  })
})
