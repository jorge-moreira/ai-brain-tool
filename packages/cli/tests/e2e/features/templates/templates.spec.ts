import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs'
import { tmpdir, homedir } from 'os'

const feature = await loadFeature('./templates.feature')

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

  const givenBrain = (brainName: string) => {
    brainPath = mkdtempSync(join(tmpdir(), `ai-brain-e2e-${brainName}-`))
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom'), { recursive: true })
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null })
    )
    const brains = readConfig()
    brains[brainName] = brainPath
    writeConfig(brains)
  }

  const run = async (args: string[]) => {
    const r = await execa('ai-brain', args, { reject: false, all: true })
    lastOutput = r.all ?? r.stdout ?? ''
    lastExitCode = r.exitCode ?? 0
  }

  Scenario('List shows bundled and custom templates', ({ Given, When, Then, And }) => {
    Given('I have a brain named {string}', (_, name: string) => {
      givenBrain(name)
    })
    When('I run the templates list command for {string}', async (_, id: string) => {
      await run(['templates', 'list', id])
    })
    Then('the command should succeed', () => {
      expect(lastExitCode).toBe(0)
    })
    And('the output should contain {string}', (_, text: string) => {
      expect(lastOutput).toContain(text)
    })
  })

  Scenario('List shows empty custom message', ({ Given, When, Then }) => {
    Given('I have a brain named {string}', (_, name: string) => {
      givenBrain(name)
    })
    When('I run the templates list command for {string}', async (_, id: string) => {
      await run(['templates', 'list', id])
    })
    Then('the output should contain {string}', (_, text: string) => {
      expect(lastOutput).toContain(text)
    })
  })
})
