import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => {
  const boldFn = vi.fn((s) => s)
  boldFn.cyan = vi.fn((s) => s)
  return {
    default: {
      red: vi.fn((s) => s),
      green: vi.fn((s) => s),
      yellow: vi.fn((s) => s),
      dim: vi.fn((s) => s),
      bold: boldFn,
      cyan: vi.fn((s) => s)
    }
  }
})

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn()
  }))
}))

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  checkbox: vi.fn(),
  confirm: vi.fn()
}))

vi.mock('../../src/scaffold.js', () => ({
  createBrainFolder: vi.fn(),
  writeBrainConfig: vi.fn()
}))

vi.mock('../../src/graphify.js', () => ({
  createVenv: vi.fn(),
  venvExists: vi.fn()
}))

vi.mock('../../src/platforms/index.js', () => ({
  detectAll: vi.fn(),
  configureSelected: vi.fn()
}))

vi.mock('../../src/git.js', () => ({
  initRepo: vi.fn(),
  writeGitignore: vi.fn()
}))

vi.mock('../../src/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  addBrain: vi.fn(),
  ensureConfigDir: vi.fn(),
  configPath: vi.fn(),
  isBrainIdAvailable: vi.fn()
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
    readFileSync: vi.fn(actual.readFileSync)
  }
})

describe('commands/setup', () => {
  let consoleLogSpy, consoleErrorSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should run new machine setup when existing brain detected', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'setup-test-'))
    const fs = await import('fs')
    
    // Mock existsSync to return true for all BRAIN_MARKER files
    fs.existsSync.mockImplementation((path) => {
      const markers = ['raw', '.graphifyignore', '.brain-config.json']
      return markers.some(m => path.includes(m))
    })
    
    fs.readFileSync.mockReturnValue(JSON.stringify({ extras: ['office'] }))

    const prompts = await import('@inquirer/prompts')
    prompts.select.mockResolvedValue('brain') // Obsidian choice
    prompts.checkbox.mockResolvedValue([]) // Selected platforms

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([
      { name: 'Claude', detected: true, configHint: '~/.claude' }
    ])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Existing brain detected')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should run fresh setup for new brain', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain') // Brain folder name
    prompts.select.mockResolvedValueOnce('current') // Location choice
    prompts.select.mockResolvedValueOnce('local') // Git mode
    prompts.checkbox.mockResolvedValueOnce([]) // Extras
    prompts.checkbox.mockResolvedValueOnce([]) // Selected platforms
    prompts.select.mockResolvedValueOnce('skip') // Obsidian choice

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(prompts.input).toHaveBeenCalled()
    expect(prompts.select).toHaveBeenCalled()
    expect(prompts.checkbox).toHaveBeenCalled()
  })

  it('should handle custom location choice', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain') // Brain folder name
    prompts.select.mockResolvedValueOnce('custom') // Location choice
    prompts.input.mockResolvedValueOnce('/custom/path') // Custom path
    prompts.select.mockResolvedValueOnce('local') // Git mode
    prompts.checkbox.mockResolvedValueOnce([]) // Extras
    prompts.checkbox.mockResolvedValueOnce([]) // Selected platforms
    prompts.select.mockResolvedValueOnce('skip') // Obsidian choice

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(prompts.input).toHaveBeenCalledTimes(3) // name + custom path + brain id

    rmSync('/custom/path/ai-brain', { recursive: true, force: true })
  })

  it('should handle git mode with remote', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain') // Brain folder name
    prompts.select.mockResolvedValueOnce('current') // Location choice
    prompts.select.mockResolvedValueOnce('git') // Git mode
    prompts.input.mockResolvedValueOnce('https://github.com/repo') // Remote URL
    prompts.confirm.mockResolvedValueOnce(true) // Commit cache
    prompts.confirm.mockResolvedValueOnce(true) // Git sync
    prompts.checkbox.mockResolvedValueOnce([]) // Extras
    prompts.checkbox.mockResolvedValueOnce([]) // Selected platforms
    prompts.select.mockResolvedValueOnce('skip') // Obsidian choice

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const git = await import('../../src/git.js')
    git.initRepo.mockResolvedValue()
    git.writeGitignore.mockResolvedValue()

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(git.initRepo).toHaveBeenCalled()
    expect(git.writeGitignore).toHaveBeenCalled()
  })

  it('should handle extras selection', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain')
    prompts.select.mockResolvedValueOnce('current')
    prompts.select.mockResolvedValueOnce('local')
    prompts.checkbox.mockResolvedValueOnce(['office', 'video']) // Extras
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.select.mockResolvedValueOnce('skip')

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(prompts.checkbox).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('file types')
      })
    )
  })

  it('should handle obsidian brain folder choice', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain')
    prompts.select.mockResolvedValueOnce('current')
    prompts.select.mockResolvedValueOnce('local')
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.select.mockResolvedValueOnce('brain') // Use brain as vault

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(scaffold.createBrainFolder).toHaveBeenCalledWith(
      expect.objectContaining({ includeObsidian: true })
    )
  })

  it('should handle obsidian separate vault choice', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain')
    prompts.select.mockResolvedValueOnce('current')
    prompts.select.mockResolvedValueOnce('local')
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.select.mockResolvedValueOnce('separate') // Separate vault
    prompts.input.mockResolvedValueOnce('/vault/path') // Vault path

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(prompts.input).toHaveBeenCalledTimes(3) // name + vault path + brain id
  })

  it('should handle duplicate brain id by prompting again', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain')
    prompts.select.mockResolvedValueOnce('current')
    prompts.select.mockResolvedValueOnce('local')
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.select.mockResolvedValueOnce('skip')
    prompts.input
      .mockResolvedValueOnce('duplicate') // First attempt - duplicate
      .mockResolvedValueOnce('unique') // Second attempt - unique

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable
      .mockReturnValueOnce(false) // First check - not available
      .mockReturnValueOnce(true) // Second check - available

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(config.isBrainIdAvailable).toHaveBeenCalledTimes(2)
  })

  it('should print summary at end of fresh setup', async () => {
    const fs = await import('fs')
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const prompts = await import('@inquirer/prompts')
    prompts.input.mockResolvedValueOnce('ai-brain')
    prompts.select.mockResolvedValueOnce('current')
    prompts.select.mockResolvedValueOnce('local')
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.checkbox.mockResolvedValueOnce([])
    prompts.select.mockResolvedValueOnce('skip')

    const platforms = await import('../../src/platforms/index.js')
    platforms.detectAll.mockResolvedValue([])

    const config = await import('../../src/config.js')
    config.configPath.mockReturnValue('/fake/config/path')
    config.ensureConfigDir.mockImplementation(() => {})
    config.isBrainIdAvailable.mockReturnValue(true)

    const graphify = await import('../../src/graphify.js')
    graphify.createVenv.mockResolvedValue()

    const scaffold = await import('../../src/scaffold.js')
    scaffold.createBrainFolder.mockResolvedValue()

    const { run } = await import('../../src/commands/setup.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Setup complete')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Next steps')
    )
  })
})
