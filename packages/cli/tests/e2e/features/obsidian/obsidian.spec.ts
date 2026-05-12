import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { execa } from 'execa'
import { join } from 'path'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs'
import { tmpdir, homedir } from 'os'

const feature = await loadFeature('./obsidian.feature')

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

  const givenBrain = (name: string, cfg: Record<string, unknown> = {}) => {
    brainPath = mkdtempSync(join(tmpdir(), `ai-brain-e2e-${name}-`))
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null, ...cfg })
    )
    const brains = readConfig()
    brains[name] = brainPath
    writeConfig(brains)
  }

  const run = async (args: string[]) => {
    const r = await execa('ai-brain', args, { reject: false, all: true })
    lastOutput = r.all ?? r.stdout ?? ''
    lastExitCode = r.exitCode ?? 0
  }

  Scenario('Show existing vault configuration', ({ Given, When, Then }) => {
    Given('I have a brain named {string} with obsidian configured', (_, n: string) => {
      givenBrain(n, { obsidianDir: '/tmp/my-vault' })
    })
    When('I run setup-obsidian for {string}', async (_, id: string) => {
      await run(['setup-obsidian', id])
    })
    Then('the output should show current vault configuration', () => {
      expect(lastOutput).toContain('Current vault')
    })
  })
})
