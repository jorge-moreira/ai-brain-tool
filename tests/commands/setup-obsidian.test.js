import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
    green: vi.fn((s) => s),
    cyan: vi.fn((s) => s)
  }
}))

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(() => Promise.resolve({ vaultPath: '' }))
  }
}))

describe('commands/setup-obsidian', () => {
  let resolveBrainSpy, readBrainConfigSpy
  let consoleLogSpy, consoleErrorSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const config = await import('../../src/config.js')
    resolveBrainSpy = vi.spyOn(config, 'resolveBrain')
    readBrainConfigSpy = vi.spyOn(config, 'readBrainConfig')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('run', () => {
    it('should resolve brain from id argument', async () => {
      resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['work'], { vaultPath: '/tmp/work' })

      expect(resolveBrainSpy).toHaveBeenCalledWith('work')
    })

    it('should resolve brain from options.brainId', async () => {
      resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { brainId: 'work', vaultPath: '/tmp/work' })

      expect(resolveBrainSpy).toHaveBeenCalledWith('work')
    })

    it('should print brain id in header', async () => {
      resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['work'], { vaultPath: '/tmp/work' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('work')
      )
    })

    it('should write obsidianDir to brain config', async () => {
      const brainPath = '/tmp/work'
      mkdirSync(brainPath, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { vaultPath: brainPath })

      const configPath = join(brainPath, '.brain-config.json')
      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(config.obsidianDir).toBe(brainPath)
    })

    it('should show already configured when obsidianDir exists without --update', async () => {
      const brainPath = '/tmp/work'
      mkdirSync(brainPath, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { vaultPath: brainPath })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('already configured')
      )
    })

    it('should proceed when --update flag provided', async () => {
      const brainPath = '/tmp/work'
      mkdirSync(brainPath, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['work', '--update'], { vaultPath: brainPath })

      expect(resolveBrainSpy).toHaveBeenCalledWith('work')
    })

    it('should support -u shorthand', async () => {
      const brainPath = '/tmp/work'
      mkdirSync(brainPath, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['work', '-u'], { vaultPath: brainPath })

      expect(resolveBrainSpy).toHaveBeenCalledWith('work')
    })

    it('should handle when brain not found', async () => {
      resolveBrainSpy.mockImplementation(() => {
        throw new Error('Brain "nonexistent" not found')
      })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await expect(run(['nonexistent'], {})).rejects.toThrow('BRAIN_NOT_RESOLVED')
    })

    it('should throw when no brain configured', async () => {
      resolveBrainSpy.mockReturnValue({ id: null, path: null, isLocal: false })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await expect(run([], {})).rejects.toThrow('NO_BRAIN_CONFIGURED')
    })

    it('should use inquirer when vaultPath not provided', async () => {
      const brainPath = '/tmp/work'
      mkdirSync(brainPath, { recursive: true })
      
      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: null })
      
      const inquirer = await import('inquirer')
      inquirer.default.prompt.mockResolvedValue({ vaultPath: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], {})

      expect(inquirer.default.prompt).toHaveBeenCalled()
    })

    it('should create vault directory if not exists', async () => {
      const brainPath = '/tmp/work'
      const vaultPath = join('/tmp', 'new-vault-' + Date.now())
      mkdirSync(brainPath, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { vaultPath })

      expect(existsSync(vaultPath)).toBe(true)
      rmSync(vaultPath, { recursive: true, force: true })
    })

    it('should skip scaffold copy when .obsidian exists', async () => {
      const brainPath = '/tmp/work'
      const vaultPath = join('/tmp', 'skip-scaffold-' + Date.now())
      const vaultObsidianDir = join(vaultPath, '.obsidian')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(vaultObsidianDir, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { vaultPath })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      )
      rmSync(vaultPath, { recursive: true, force: true })
    })

    it('should show different when vault is not same as brain', async () => {
      const brainPath = '/tmp/brain'
      const vaultPath = '/tmp/vault'
      mkdirSync(brainPath, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: vaultPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { vaultPath })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('different')
      )
    })

    it('should show same as brain when vault equals brainPath', async () => {
      const brainPath = '/tmp/work'
      mkdirSync(brainPath, { recursive: true })

      resolveBrainSpy.mockReturnValue({ id: 'work', path: brainPath, isLocal: false })
      readBrainConfigSpy.mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { vaultPath: brainPath })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('same as brain')
      )
    })
  })
})