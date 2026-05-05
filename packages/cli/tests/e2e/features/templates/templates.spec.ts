import { E2EContext } from '../../types/e2e-context'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs'

const feature = await loadFeature('./templates.feature')

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  const ctx: E2EContext = { tempDir: '', brainPath: '', lastOutput: '', lastExitCode: 0 }

  AfterEachScenario(async () => {
    if (ctx.lastOutput && ctx.lastExitCode !== 0) {
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

  const givenBrain = async (brainName: string) => {
    const { mkdtempSync } = await import('fs')
    const { tmpdir } = await import('os')
    ctx.tempDir = mkdtempSync(join(tmpdir(), 'ai-brain-e2e-'))
    ctx.brainPath = join(ctx.tempDir, brainName)
    mkdirSync(ctx.brainPath, { recursive: true })
    mkdirSync(join(ctx.brainPath, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(ctx.brainPath, 'raw', 'templates', 'markdown', '_custom'), { recursive: true })
    mkdirSync(join(ctx.brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), {
      recursive: true
    })
    mkdirSync(join(ctx.brainPath, 'raw', 'templates', 'web-clipper', '_custom'), {
      recursive: true
    })
    mkdirSync(join(ctx.tempDir, '.ai-brain-tool'), { recursive: true })
    writeFileSync(
      join(ctx.brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null })
    )
    writeFileSync(
      join(ctx.tempDir, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { [brainName]: ctx.brainPath } })
    )
  }

  const run = async (args: string[], input?: string) => {
    const result = await execa('ai-brain', args, {
      env: { ...process.env, HOME: ctx.tempDir },
      input,
      reject: false,
      all: true
    })
    ctx.lastOutput = result.all ?? result.stdout ?? ''
    ctx.lastExitCode = result.exitCode ?? 0
  }

  Scenario('List shows bundled and custom templates', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string}', async (_, name: string) => {
      await givenBrain(name)
    })
    When('I run the templates list command for {string}', async (_, id: string) => {
      await run(['templates', 'list', id])
    })
    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })
    And('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })
  })

  Scenario('List shows empty custom message', ({ Given, When, Then }) => {
    Given('I have a brain named {string}', async (_, name: string) => {
      await givenBrain(name)
    })
    When('I run the templates list command for {string}', async (_, id: string) => {
      await run(['templates', 'list', id])
    })
    Then('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })
  })
})
