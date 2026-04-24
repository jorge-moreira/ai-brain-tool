import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
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
  const testRoot = mkdtempSync(join(tmpdir(), 'brain-test-'))
  let consoleLogSpy, consoleErrorSpy

  beforeEach(() => {
    process.env.__HOME__ = testRoot
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
    rmSync(testRoot, { recursive: true, force: true })
    mkdirSync(testRoot, { recursive: true })
  })

  describe('run', () => {
    it('should show error when no brain configured', async () => {
      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue(null)

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await expect(run([])).rejects.toThrow('NO_BRAIN_CONFIGURED')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No brain configured')
      )
    })

    it('should show error when brainPath is missing', async () => {
      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({})

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await expect(run([])).rejects.toThrow('NO_BRAIN_CONFIGURED')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No brain configured')
      )
    })

    it('should show current vault and return when already configured without --update', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([])

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Vault already configured')
      )
    })

    it('should show current vault path when configured', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([])

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(brainPath)
      )
    })

    it('should show different when vault is not same as brain', async () => {
      const brainPath = join(testRoot, 'brain')
      const vaultPath = join(testRoot, 'vault')
      mkdirSync(brainPath, { recursive: true })

      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: vaultPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([])

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('different')
      )
    })

    it('should write obsidianDir to brain config', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const vaultPath = join(testRoot, 'vault')
      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], { vaultPath })

      const configPath = join(brainPath, '.brain-config.json')
      const configData = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(configData.obsidianDir).toBe(vaultPath)
    })

    it('should handle --update flag to reconfigure existing vault', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const vaultPath = join(testRoot, 'new-vault')
      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['--update'], { vaultPath })

      const configPath = join(brainPath, '.brain-config.json')
      const configData = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(configData.obsidianDir).toBe(vaultPath)
    })

    it('should use brainPath as default vault path when no vaultPath provided', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: null })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([], {})

      const configPath = join(brainPath, '.brain-config.json')
      const configData = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(configData.obsidianDir).toBe(brainPath)
    })

    it('should preserve existing config when updating', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })
      const configPath = join(brainPath, '.brain-config.json')
      
      const originalConfig = { gitSync: true, extras: ['test'], obsidianDir: null }
      writeFileSync(configPath, JSON.stringify(originalConfig))

      const vaultPath = join(testRoot, 'new-vault')
      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockImplementation((p) => 
        JSON.parse(readFileSync(join(p, '.brain-config.json'), 'utf8'))
      )

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['--update'], { vaultPath })

      const updatedConfig = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(updatedConfig.gitSync).toBe(true)
      expect(updatedConfig.extras).toEqual(['test'])
      expect(updatedConfig.obsidianDir).toBe(vaultPath)
    })

    it('should support -u shorthand for --update', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const vaultPath = join(testRoot, 'new-vault')
      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['-u'], { vaultPath })

      const configPath = join(brainPath, '.brain-config.json')
      const configData = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(configData.obsidianDir).toBe(vaultPath)
    })

    it('should print updating message when using --update', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run(['--update'], { vaultPath: brainPath })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating')
      )
    })

    it('should show "same as brain" when vault equals brainPath', async () => {
      const brainPath = join(testRoot, 'brain')
      mkdirSync(brainPath, { recursive: true })

      const config = await import('../../src/config.js')
      vi.spyOn(config, 'readConfig').mockReturnValue({ brainPath })
      vi.spyOn(config, 'readBrainConfig').mockReturnValue({ obsidianDir: brainPath })

      const { run } = await import('../../src/commands/setup-obsidian.js')
      await run([])

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('same as brain')
      )
    })
  })
})