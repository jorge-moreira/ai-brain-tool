import { E2EContext } from '../../types/e2e-context'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs'

const feature = await loadFeature('./setup.feature')

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  const ctx: E2EContext = { tempDir: '', brainPath: '', lastOutput: '', lastExitCode: 0 }

  AfterEachScenario(async () => {
    // Save output to file for debugging failures (mounted volume)
    if (ctx.lastOutput && ctx.lastExitCode !== 0) {
      const { writeFileSync } = await import('fs')
      writeFileSync('./tests/e2e/results/last-output.txt', ctx.lastOutput)
    }

    if (ctx.tempDir && existsSync(ctx.tempDir)) {
      rmSync(ctx.tempDir, { recursive: true, force: true })
    }
    ctx.tempDir = ''
    ctx.brainPath = ''
    ctx.lastOutput = ''
    ctx.lastExitCode = 0
  })

  Scenario('List shows configured brains', ({ Given, When, Then, And }) => {
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

    When('I run the list command', async () => {
      const result = await execa('ai-brain', ['list'], {
        env: { ...process.env, HOME: ctx.tempDir },
        reject: false,
        all: true
      })

      ctx.lastOutput = result.all ?? result.stdout ?? ''
      ctx.lastExitCode = result.exitCode ?? 0
    })

    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })

    And('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })
  })

  Scenario('Status shows brain information', ({ Given, When, Then, And }) => {
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

    When('I run the status command for {string}', async (_, brainId: string) => {
      const result = await execa('ai-brain', ['status', brainId], {
        env: { ...process.env, HOME: ctx.tempDir },
        reject: false,
        all: true
      })

      ctx.lastOutput = result.all ?? result.stdout ?? ''
      ctx.lastExitCode = result.exitCode ?? 0
    })

    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })

    And('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })
  })

  Scenario('Status shows brain path', ({ Given, When, Then }) => {
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

    When('I run the status command for {string}', async (_, brainId: string) => {
      const result = await execa('ai-brain', ['status', brainId], {
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
  })
})
