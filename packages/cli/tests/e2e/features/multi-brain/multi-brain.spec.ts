import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'fs'
import { Config } from '@ai-brain/core/config'

interface E2EContext {
  tempDir: string
  brainPath: string
  lastOutput: string
  lastExitCode: number
}

const feature = await loadFeature('./multi-brain.feature')

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  const ctx: E2EContext = {
    tempDir: '',
    brainPath: '',
    lastOutput: '',
    lastExitCode: 0
  }

  // Shared step for setting up a brain
  const setupBrain = async (brainName: string) => {
    const brainPath = join(ctx.tempDir, brainName)
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
    mkdirSync(join(ctx.tempDir, '.ai-brain-tool'), { recursive: true })

    let config: Config = { brains: {} }
    const configPath = join(ctx.tempDir, '.ai-brain-tool', 'config.json')
    if (existsSync(configPath)) {
      config = JSON.parse(readFileSync(configPath, 'utf8')) as Config
    }
    config.brains[brainName] = brainPath
    writeFileSync(configPath, JSON.stringify(config))
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null })
    )
  }

  Scenario('Create multiple brains', ({ Given, When, Then, And }) => {
    Given('I am on a fresh machine', async () => {
      const { mkdtempSync } = await import('fs')
      const { tmpdir } = await import('os')
      ctx.tempDir = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-'))
    })

    When('I run setup for brain {string}', async (_, brainName: string) => {
      await setupBrain(brainName)
    })

    And('I run setup for brain {string}', async (_, brainName: string) => {
      await setupBrain(brainName)
    })

    Then('I should have two brains configured', () => {
      const config = JSON.parse(
        readFileSync(join(ctx.tempDir, '.ai-brain-tool', 'config.json'), 'utf8')
      ) as Config
      expect(Object.keys(config.brains).length).toBe(2)
    })
  })

  Scenario('List shows all brains', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string}', async (_, brainName: string) => {
      const { mkdtempSync } = await import('fs')
      const { tmpdir } = await import('os')

      const tempDir = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-'))
      const brainPath = join(tempDir, brainName)

      ctx.tempDir = tempDir
      ctx.brainPath = brainPath

      mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
      mkdirSync(join(tempDir, '.ai-brain-tool'), { recursive: true })

      const config = { brains: { [brainName]: brainPath } }
      writeFileSync(join(tempDir, '.ai-brain-tool', 'config.json'), JSON.stringify(config))
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({ gitSync: false, extras: [], obsidianDir: null })
      )
    })

    And('I have a brain named {string}', async (_, brainName: string) => {
      const brainPath = join(ctx.tempDir, brainName)

      ctx.brainPath = brainPath

      mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
      mkdirSync(join(ctx.tempDir, '.ai-brain-tool'), { recursive: true })

      // Read existing config and add new brain
      const configPath = join(ctx.tempDir, '.ai-brain-tool', 'config.json')
      const config = existsSync(configPath)
        ? JSON.parse(readFileSync(configPath, 'utf8'))
        : { brains: {} }
      config.brains[brainName] = brainPath
      writeFileSync(configPath, JSON.stringify(config))
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({ gitSync: false, extras: [], obsidianDir: null })
      )
    })

    When('I run the list command', async () => {
      const result = await execa('ai-brain', ['list'], {
        env: { ...process.env, HOME: ctx.tempDir },
        reject: false,
        all: true
      })

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
    Given('I have a brain named {string}', async (_, brainName: string) => {
      const { mkdtempSync } = await import('fs')
      const { tmpdir } = await import('os')

      const tempDir = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-'))
      const brainPath = join(tempDir, brainName)

      ctx.tempDir = tempDir
      ctx.brainPath = brainPath

      mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
      mkdirSync(join(tempDir, '.ai-brain-tool'), { recursive: true })

      const config = { brains: { [brainName]: brainPath } }
      writeFileSync(join(tempDir, '.ai-brain-tool', 'config.json'), JSON.stringify(config))
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({ gitSync: false, extras: [], obsidianDir: null })
      )
    })

    When('I run status with --brain-id work-brain', async () => {
      const result = await execa('ai-brain', ['status', '--brain-id', 'work-brain'], {
        env: { ...process.env, HOME: ctx.tempDir },
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
    Given('I have a brain at {string}', async (_, brainPath: string) => {
      const { mkdtempSync } = await import('fs')
      const { tmpdir } = await import('os')

      const tempDir = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-'))
      const fullBrainPath = join(tempDir, brainPath.replace('/tmp/', ''))

      ctx.tempDir = tempDir
      ctx.brainPath = fullBrainPath

      mkdirSync(join(fullBrainPath, 'raw', 'notes'), { recursive: true })
      mkdirSync(join(tempDir, '.ai-brain-tool'), { recursive: true })

      const config = { brains: { 'test-brain': fullBrainPath } }
      writeFileSync(join(tempDir, '.ai-brain-tool', 'config.json'), JSON.stringify(config))
      writeFileSync(
        join(fullBrainPath, '.brain-config.json'),
        JSON.stringify({ gitSync: false, extras: [], obsidianDir: null })
      )
    })

    And('I am inside the test-brain folder', () => {
      ctx.brainPath = join(ctx.tempDir, 'test-brain')
    })

    When('I run status without --brain-id', async () => {
      const result = await execa('ai-brain', ['status'], {
        cwd: ctx.brainPath,
        env: { ...process.env, HOME: ctx.tempDir },
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

  AfterEachScenario(() => {
    if (ctx.tempDir && existsSync(ctx.tempDir)) {
      rmSync(ctx.tempDir, { recursive: true, force: true })
    }
    ctx.tempDir = ''
    ctx.brainPath = ''
    ctx.lastOutput = ''
    ctx.lastExitCode = 0
  })
})
