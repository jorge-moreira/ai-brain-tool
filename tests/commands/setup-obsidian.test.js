import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    green: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
    dim: vi.fn((s) => s),
    bold: { cyan: vi.fn((s) => s) },
    cyan: vi.fn((s) => s)
  }
}))

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  }
}))

vi.mock('../../src/config.js', () => ({
  resolveBrain: vi.fn(),
  readBrainConfig: vi.fn(),
  readConfig: vi.fn()
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
    mkdirSync: vi.fn(actual.mkdirSync),
    cpSync: vi.fn(actual.cpSync),
    writeFileSync: vi.fn(actual.writeFileSync),
    readFileSync: vi.fn(actual.readFileSync)
  }
})

describe('commands/setup-obsidian', () => {
  let consoleLogSpy, consoleErrorSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should throw error when brain cannot be resolved', async () => {
    const config = await import('../../src/config.js')
    config.resolveBrain.mockImplementation(() => {
      throw new Error('Brain not found')
    })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    
    await expect(run([])).rejects.toThrow('BRAIN_NOT_RESOLVED')
  })

  it('should throw error when no brain configured', async () => {
    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: null, path: null })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    
    await expect(run([])).rejects.toThrow('NO_BRAIN_CONFIGURED')
  })

  it('should show current vault and prompt to update when already configured', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({ obsidianDir: tmp })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run([])

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Current vault')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('(same as brain)')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('setup-obsidian (test)')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('To update')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show different brain folder when vault is separate', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const vaultPath = join(tmpdir(), 'separate-vault')
    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({ obsidianDir: vaultPath })

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run(['--update'])

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('different')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should update vault when --update flag is provided', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(true)

    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({ obsidianDir: tmp })

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath: tmp })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run(['--update'])

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Updating vault')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should prompt for vault path when not provided', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)

    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({})

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath: tmp })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run([])

    expect(inquirer.default.prompt).toHaveBeenCalled()
    
    // Verify the prompt was configured with a filter function that trims input
    const promptArgs = inquirer.default.prompt.mock.calls[0][0]
    const vaultPathPrompt = promptArgs.find(p => p.name === 'vaultPath')
    expect(vaultPathPrompt.filter).toBeDefined()
    expect(vaultPathPrompt.filter('  /path/with/spaces  ')).toBe('/path/with/spaces')

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should use vaultPath from options when provided', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)

    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({})

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath: tmp })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run([], { vaultPath: tmp })

    expect(inquirer.default.prompt).not.toHaveBeenCalled()

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should create vault directory if it does not exist', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const vaultPath = join(tmp, 'new-vault')
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)

    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({})

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run([])

    expect(fs.mkdirSync).toHaveBeenCalled()

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should copy obsidian scaffold when .obsidian does not exist', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const vaultPath = join(tmp, 'vault')
    const fs = await import('fs')
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('.obsidian')) return false
      return true
    })

    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({})

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run([])

    expect(fs.cpSync).toHaveBeenCalled()

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should skip scaffold copy when .obsidian already exists', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const vaultPath = join(tmp, 'vault')
    const fs = await import('fs')
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('.obsidian')) return true
      return true
    })

    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({})

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run([])

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should write updated brain config with obsidianDir', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'obsidian-test-'))
    const vaultPath = join(tmp, 'vault')
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)

    const config = await import('../../src/config.js')
    config.resolveBrain.mockReturnValue({ id: 'test', path: tmp })
    config.readBrainConfig.mockReturnValue({ existing: 'config' })

    const inquirer = await import('inquirer')
    inquirer.default.prompt.mockResolvedValue({ vaultPath })

    const { run } = await import('../../src/commands/setup-obsidian.js')
    await run([])

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.brain-config.json'),
      expect.stringContaining('obsidianDir'),
      'utf8'
    )

    rmSync(tmp, { recursive: true, force: true })
  })
})
