import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs'
import { tmpdir, homedir } from 'os'
import { E2EContext } from '../../types/e2e-context'

const feature = await loadFeature('./status.feature')

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
  const ctx: E2EContext = { brainPath: '', lastOutput: '', lastExitCode: 0 }

  AfterEachScenario(() => {
    if (ctx.lastOutput && ctx.lastExitCode !== 0)
      writeFileSync('./tests/e2e/results/last-output.txt', ctx.lastOutput)
    if (ctx.brainPath && existsSync(ctx.brainPath))
      rmSync(ctx.brainPath, { recursive: true, force: true })
    ctx.brainPath = ''
    ctx.lastOutput = ''
    ctx.lastExitCode = 0
  })

  const givenBrain = (brainName: string) => {
    ctx.brainPath = mkdtempSync(join(tmpdir(), `ai-brain-e2e-${brainName}-`))
    mkdirSync(join(ctx.brainPath, 'raw', 'notes'), { recursive: true })
    writeFileSync(
      join(ctx.brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null })
    )
    const brains = readConfig()
    brains[brainName] = ctx.brainPath
    writeConfig(brains)
  }

  const runStatus = async (brainId: string) => {
    const r = await execa('ai-brain', ['status', brainId], { reject: false, all: true })
    ctx.lastOutput = r.all ?? r.stdout ?? ''
    ctx.lastExitCode = r.exitCode ?? 0
  }

  Scenario('Status shows brain information', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string}', (_, brainName: string) => {
      givenBrain(brainName)
    })
    When('I run the status command for {string}', async (_, brainId: string) => {
      await runStatus(brainId)
    })
    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })
    And('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })
  })

  Scenario('Status shows brain path', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string}', (_, brainName: string) => {
      givenBrain(brainName)
    })
    When('I run the status command for {string}', async (_, brainId: string) => {
      await runStatus(brainId)
    })
    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })
    And('the output should contain {string}', (_, text: string) => {
      expect(ctx.lastOutput).toContain(text)
    })
  })
})
