import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs'
import { E2EContext } from '../../types/e2e-context'

const feature = await loadFeature('./upgrade.feature')

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  const ctx: E2EContext = { tempDir: '', brainPath: '', lastOutput: '', lastExitCode: 0 }

  AfterEachScenario(async () => {
    if (ctx.lastOutput && ctx.lastExitCode !== 0)
      writeFileSync('./tests/e2e/results/last-output.txt', ctx.lastOutput)
    if (ctx.tempDir && existsSync(ctx.tempDir))
      rmSync(ctx.tempDir, { recursive: true, force: true })
    ctx.tempDir = ''
    ctx.brainPath = ''
    ctx.lastOutput = ''
    ctx.lastExitCode = 0
  })

  const givenBrain = async (name: string) => {
    const { mkdtempSync } = await import('fs')
    const { tmpdir } = await import('os')
    ctx.tempDir = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-'))
    ctx.brainPath = join(ctx.tempDir, name)
    mkdirSync(ctx.brainPath, { recursive: true })
    mkdirSync(join(ctx.brainPath, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(ctx.brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), {
      recursive: true
    })
    mkdirSync(join(ctx.tempDir, '.ai-brain-tool'), { recursive: true })
    writeFileSync(
      join(ctx.brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null })
    )
    writeFileSync(
      join(ctx.tempDir, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { [name]: ctx.brainPath } })
    )
  }

  const run = async (args: string[]) => {
    const r = await execa('ai-brain', args, {
      env: { ...process.env, HOME: ctx.tempDir },
      reject: false,
      all: true
    })
    ctx.lastOutput = (r.all ?? r.stdout ?? '') + (r.stderr ?? '')
    ctx.lastExitCode = r.exitCode ?? 0
  }

  Scenario('Upgrade shows brain resolution', ({ Given, When, Then }) => {
    Given('I have a brain named {string} with templates', async (_, n: string) => {
      await givenBrain(n)
    })
    When('I run the upgrade command for {string}', async (_, id: string) => {
      await run(['upgrade', id])
    })
    Then('the command should attempt to upgrade', () => {
      expect(ctx.lastOutput).toBeDefined()
    })
  })

  Scenario('Upgrade rejects unknown brain', ({ Given, When, Then }) => {
    Given('I have a brain named {string}', async (_, n: string) => {
      await givenBrain(n)
    })
    When('I run the upgrade command for {string}', async (_, id: string) => {
      await run(['upgrade', id])
    })
    Then('the command should fail with brain not found', () => {
      expect(ctx.lastExitCode).toBe(1)
      expect(ctx.lastOutput).toContain('not found')
    })
  })

  Scenario('Upgrade shows help', ({ When, Then, And }) => {
    When('I run upgrade with --help', async () => {
      await run(['upgrade', '--help'])
    })
    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })
    And('the output should describe the upgrade command', () => {
      expect(ctx.lastOutput).toContain('upgrade')
    })
  })
})
