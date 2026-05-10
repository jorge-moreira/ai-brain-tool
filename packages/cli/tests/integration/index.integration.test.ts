import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { Command } from 'commander'

describe('CLI entrypoint integration', () => {
  let program: Command
  let tmpHome: string
  let originalHome: string | undefined
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    await import('../../src/index')
    const { program: p } = await import('commander')
    program = p
  })

  afterAll(() => {
    exitSpy.mockRestore()
  })

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-cli-int-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })
    writeFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), JSON.stringify({ brains: {} }))
  })

  afterEach(() => {
    process.env.HOME = originalHome
    rmSync(tmpHome, { recursive: true, force: true })
  })

  function addBrain(name: string) {
    const brainPath = join(tmpHome, name)
    mkdirSync(brainPath, { recursive: true })
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, obsidianDir: null })
    )
    const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
      brains: Record<string, string>
    }
    config.brains[name] = brainPath
    writeFileSync(configPath, JSON.stringify(config))
  }

  it('should list configured brains', async () => {
    addBrain('work')
    addBrain('personal')
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await program.parseAsync(['list'], { from: 'user' })

    const output = spy.mock.calls.map(c => c.join(' ')).join('\n')
    expect(output).toContain('work')
    expect(output).toContain('personal')
    spy.mockRestore()
  })

  it('should show brain status', async () => {
    addBrain('my-brain')
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await program.parseAsync(['status', 'my-brain'], { from: 'user' })

    const output = spy.mock.calls.map(c => c.join(' ')).join('\n')
    expect(output).toContain('Tool version:')
    expect(output).toContain('Brain path:')
    spy.mockRestore()
  })

  it('should show no brains message', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await program.parseAsync(['list'], { from: 'user' })

    const output = spy.mock.calls.map(c => c.join(' ')).join('\n')
    expect(output).toContain('No brains configured')
    spy.mockRestore()
  })

  it('should reject unknown brain', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      program.parseAsync(['update', 'no-such-brain'], { from: 'user' })
    ).rejects.toThrow()

    spy.mockRestore()
  })
})
