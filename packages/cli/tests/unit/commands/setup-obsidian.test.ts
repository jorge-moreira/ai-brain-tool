import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import * as fs from 'fs'
import { join } from 'path'
import * as inquirer from 'inquirer'
import * as config from '@ai-brain/core/config'
import type { BrainConfig, ResolvedBrain } from '@ai-brain/core/config'
import { run } from '../../../src/commands/setup-obsidian'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    bold: { cyan: vi.fn((s: string) => s) },
    cyan: vi.fn((s: string) => s)
  }
}))

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  cpSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdtempSync: vi.fn(),
  rmSync: vi.fn()
}))

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  }
}))

vi.mock('@ai-brain/core/config', () => ({
  getBrainPath: vi.fn(),
  resolveBrain: vi.fn(),
  readBrainConfig: vi.fn(),
  readConfig: vi.fn()
}))

const mockedResolveBrain = config.resolveBrain as Mock<typeof config.resolveBrain>
const mockedReadBrainConfig = config.readBrainConfig as Mock<typeof config.readBrainConfig>
const mockedInquirerPrompt = inquirer.default.prompt as Mock<typeof inquirer.default.prompt>
const mockedExistsSync = fs.existsSync as unknown as Mock<typeof fs.existsSync>
const mockedMkdirSync = fs.mkdirSync as unknown as Mock<typeof fs.mkdirSync>
const mockedCpSync = fs.cpSync as unknown as Mock<typeof fs.cpSync>
const mockedWriteFileSync = fs.writeFileSync as unknown as Mock<typeof fs.writeFileSync>

describe('commands/setup-obsidian', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(async () => {
    vi.clearAllMocks()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw error when brain cannot be resolved', async () => {
    mockedResolveBrain.mockImplementation(() => {
      throw new Error('Brain not found')
    })

    await expect(run([])).rejects.toThrow('BRAIN_NOT_RESOLVED')
  })

  it('should throw error when no brain configured', async () => {
    mockedResolveBrain.mockImplementation(
      () => ({ id: null, path: null }) as unknown as ResolvedBrain
    )

    await expect(run([])).rejects.toThrow('NO_BRAIN_CONFIGURED')
  })

  it('should show current vault and prompt to update when already configured', async () => {
    const tmp = '/tmp/test-brain'
    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({ obsidianDir: tmp }) as BrainConfig)

    await run([])

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Current vault'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('(same as brain)'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('setup-obsidian (test)'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('To update'))
  })

  it('should show different brain folder when vault is separate', async () => {
    const tmp = '/tmp/test-brain'
    const vaultPath = '/tmp/separate-vault'
    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({ obsidianDir: vaultPath }) as BrainConfig)

    mockedInquirerPrompt.mockResolvedValue({ vaultPath })

    await run(['--update'])

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('different'))
  })

  it('should update vault when --update flag is provided', async () => {
    const tmp = '/tmp/test-brain'
    mockedExistsSync.mockReturnValue(true)

    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({ obsidianDir: tmp }) as BrainConfig)

    mockedInquirerPrompt.mockResolvedValue({ vaultPath: tmp })

    await run(['--update'])

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Updating vault'))
  })

  it('should prompt for vault path when not provided', async () => {
    const tmp = '/tmp/test-brain'
    mockedExistsSync.mockReturnValue(false)

    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({}) as BrainConfig)

    mockedInquirerPrompt.mockResolvedValue({ vaultPath: tmp })

    await run([])

    expect(mockedInquirerPrompt).toHaveBeenCalled()

    const promptArgs = mockedInquirerPrompt.mock.calls[0][0] as unknown as Array<{
      name: string
      filter?: (value: string) => string
    }>
    const vaultPathPrompt = promptArgs.find(p => p.name === 'vaultPath')
    expect(vaultPathPrompt?.filter).toBeDefined()
    expect(vaultPathPrompt?.filter?.('  /path/with/spaces  ')).toBe('/path/with/spaces')
  })

  it('should use vaultPath from options when provided', async () => {
    const tmp = '/tmp/test-brain'
    mockedExistsSync.mockReturnValue(false)

    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({}) as BrainConfig)

    mockedInquirerPrompt.mockResolvedValue({ vaultPath: tmp })

    await run([], { vaultPath: tmp })

    expect(mockedInquirerPrompt).not.toHaveBeenCalled()
  })

  it('should create vault directory if it does not exist', async () => {
    const tmp = '/tmp/test-brain'
    const vaultPath = join(tmp, 'new-vault')
    mockedExistsSync.mockReturnValue(false)

    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({}) as BrainConfig)

    mockedInquirerPrompt.mockResolvedValue({ vaultPath })

    await run([])

    expect(mockedMkdirSync).toHaveBeenCalled()
  })

  it('should copy obsidian scaffold when .obsidian does not exist', async () => {
    const tmp = '/tmp/test-brain'
    const vaultPath = join(tmp, 'vault')
    mockedExistsSync.mockImplementation(path => {
      if (typeof path === 'string' && path.includes('.obsidian')) return false
      return true
    })

    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({}) as BrainConfig)

    mockedInquirerPrompt.mockResolvedValue({ vaultPath })

    await run([])

    expect(mockedCpSync).toHaveBeenCalled()
  })

  it('should skip scaffold copy when .obsidian already exists', async () => {
    const tmp = '/tmp/test-brain'
    const vaultPath = join(tmp, 'vault')
    mockedExistsSync.mockImplementation(path => {
      if (typeof path === 'string' && path.includes('.obsidian')) return true
      return true
    })

    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(() => ({}) as BrainConfig)

    mockedInquirerPrompt.mockResolvedValue({ vaultPath })

    await run([])

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'))
  })

  it('should write updated brain config with obsidianDir', async () => {
    const tmp = '/tmp/test-brain'
    const vaultPath = join(tmp, 'vault')
    mockedExistsSync.mockReturnValue(false)

    mockedResolveBrain.mockImplementation(() => ({ id: 'test', path: tmp }) as ResolvedBrain)
    mockedReadBrainConfig.mockImplementation(
      () => ({ existing: 'config' }) as unknown as BrainConfig
    )

    mockedInquirerPrompt.mockResolvedValue({ vaultPath })

    await run([])

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.brain-config.json'),
      expect.stringContaining('obsidianDir'),
      'utf8'
    )
  })
})
