import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs'
import { E2EContext } from '../../types/e2e-context'

const feature = await loadFeature('./obsidian.feature')

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

  const givenBrain = async (name: string, cfg: Record<string, unknown> = {}) => {
    const { mkdtempSync } = await import('fs')
    const { tmpdir } = await import('os')
    ctx.tempDir = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-'))
    ctx.brainPath = join(ctx.tempDir, name)
    mkdirSync(ctx.brainPath, { recursive: true })
    mkdirSync(join(ctx.tempDir, '.ai-brain-tool'), { recursive: true })
    writeFileSync(
      join(ctx.brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null, ...cfg })
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
    ctx.lastOutput = r.all ?? r.stdout ?? ''
    ctx.lastExitCode = r.exitCode ?? 0
  }

  Scenario('Show existing vault configuration', ({ Given, When, Then }) => {
    Given('I have a brain named {string} with obsidian configured', async (_, n: string) => {
      await givenBrain(n, { obsidianDir: '/tmp/my-vault' })
    })
    When('I run setup-obsidian for {string}', async (_, id: string) => {
      await run(['setup-obsidian', id])
    })
    Then('the output should show current vault configuration', () => {
      expect(ctx.lastOutput).toContain('Current vault')
    })
  })
})
