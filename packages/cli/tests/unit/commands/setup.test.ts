import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { select, checkbox, input, confirm } from '@inquirer/prompts'
import { createBrain } from '@ai-brain/core/brains'
import {
  configPath,
  ensureConfigDir,
  isBrainIdAvailable,
  isExistingBrain,
  isInstallationComplete,
  readConfig,
  addBrain
} from '@ai-brain/core/config'
import { createVenv, globalVenvExists, ensureUv, createGlobalVenv } from '@ai-brain/core/graphify'
import { detectAll, createBrainMCP, type DetectedPlatform } from '@ai-brain/core/platforms'
import { initRepo, writeGitignore } from '@ai-brain/core/git'
import { run } from '../../../src/commands/setup'

vi.mock('chalk', () => {
  const boldFn: Mock<(s: string) => string> & { cyan: Mock<(s: string) => string> } = vi.fn(
    (s: string) => s
  ) as unknown as Mock<(s: string) => string> & { cyan: Mock<(s: string) => string> }
  boldFn.cyan = vi.fn((s: string) => s)
  return {
    default: {
      red: vi.fn((s: string) => s),
      green: vi.fn((s: string) => s),
      yellow: vi.fn((s: string) => s),
      dim: vi.fn((s: string) => s),
      bold: boldFn,
      cyan: vi.fn((s: string) => s)
    }
  }
})

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis()
  }))
}))

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn<typeof input>(),
  select: vi.fn<typeof select>(),
  checkbox: vi.fn<typeof checkbox>(),
  confirm: vi.fn<typeof confirm>()
}))

vi.mock('@ai-brain/core/brains', () => ({
  createBrain: vi
    .fn()
    .mockResolvedValue({ success: true, brainId: 'test', brainPath: '/tmp/test' }),
  importBrain: vi.fn(),
  removeBrain: vi.fn(),
  isExistingBrain: vi.fn().mockReturnValue(false)
}))

vi.mock('@ai-brain/core/path-utils', () => ({
  getPackageRoot: vi.fn().mockReturnValue('/tmp/mock-core'),
  getPackageResource: vi.fn((path: string) => `/tmp/mock-core/${path}`)
}))

vi.mock('@ai-brain/core/scaffold', () => ({
  writeBrainConfig: vi.fn()
}))

vi.mock('@ai-brain/core/graphify', () => ({
  createVenv: vi.fn<typeof createVenv>(),
  createGlobalVenv: vi.fn(),
  venvExists: vi.fn(),
  globalVenvExists: vi.fn(),
  ensureUv: vi.fn()
}))

vi.mock('@ai-brain/core/platforms', () => ({
  detectAll: vi.fn().mockResolvedValue([]),
  createBrainMCP: vi.fn()
}))

vi.mock('@ai-brain/core/brains', () => ({
  createBrain: vi
    .fn()
    .mockResolvedValue({ success: true, brainId: 'test', brainPath: '/tmp/test' }),
  importBrain: vi.fn(),
  removeBrain: vi.fn(),
  isExistingBrain: vi.fn().mockReturnValue(false)
}))

vi.mock('@ai-brain/core/path-utils', () => ({
  getPackageRoot: vi.fn().mockReturnValue('/tmp/mock-core'),
  getPackageResource: vi.fn((path: string) => `/tmp/mock-core/${path}`)
}))

vi.mock('@ai-brain/core/git', () => ({
  initRepo: vi.fn<typeof initRepo>(),
  writeGitignore: vi.fn()
}))

vi.mock('@ai-brain/core/config', () => ({
  readConfig: vi.fn(() => ({ graphifyyExtras: [], aiTools: [], brains: {} })),
  writeConfig: vi.fn(),
  addBrain: vi.fn(),
  isExistingBrain: vi.fn().mockReturnValue(false),
  ensureConfigDir: vi.fn(),
  configPath: vi.fn(),
  isBrainIdAvailable: vi.fn(),
  isInstallationComplete: vi.fn(),
  setInstallationComplete: vi.fn(),
  addGraphifyyExtra: vi.fn(),
  createInitialConfig: vi.fn(() => ({
    installationComplete: false,
    graphifyyExtras: [],
    aiTools: [],
    brains: []
  }))
}))

vi.mock('child_process', () => ({
  execSync: vi.fn().mockImplementation((cmd: string) => {
    if (cmd === 'uv --version') return ''
    throw new Error(`execSync not mocked for: ${cmd}`)
  })
}))

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdtempSync: vi.fn(),
  rmSync: vi.fn()
}))

const mockedSelect = select as Mock<typeof select>
const mockedCheckbox = checkbox as Mock<typeof checkbox>
const mockedInput = input as Mock<typeof input>
const mockedConfirm = confirm as Mock<typeof confirm>
const mockedCreateBrain = createBrain as Mock<typeof createBrain>
const mockedCreateVenv = createVenv as Mock<typeof createVenv>
const mockedDetectAll = detectAll as Mock<typeof detectAll>
const mockedCreateBrainMCP = createBrainMCP as Mock<typeof createBrainMCP>
const mockedConfigPath = configPath as Mock<typeof configPath>
const mockedEnsureConfigDir = ensureConfigDir as Mock<typeof ensureConfigDir>
const mockedIsBrainIdAvailable = isBrainIdAvailable as Mock<typeof isBrainIdAvailable>
const mockedIsExistingBrain = isExistingBrain as Mock<typeof isExistingBrain>
const mockedInitRepo = initRepo as Mock<typeof initRepo>
const mockedWriteGitignore = writeGitignore as Mock<typeof writeGitignore>
const mockedExistsSync = existsSync as Mock<typeof existsSync>
const mockedWriteFileSync = writeFileSync as Mock<typeof writeFileSync>
const mockedIsInstallationComplete = isInstallationComplete as Mock<typeof isInstallationComplete>
const mockedReadConfig = readConfig as Mock<typeof readConfig>
const mockedGlobalVenvExists = globalVenvExists as Mock<typeof globalVenvExists>
const mockedEnsureUv = ensureUv as Mock<typeof ensureUv>
const mockedCreateGlobalVenv = createGlobalVenv as Mock<typeof createGlobalVenv>
const _mockedAddBrain = addBrain as Mock<typeof addBrain>

describe('commands/setup', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockedIsExistingBrain.mockReturnValue(false)
    mockedCreateBrain.mockResolvedValue({
      success: true,
      brainId: 'test-brain',
      brainPath: '/tmp/test-brain'
    })
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should run new machine setup when existing brain detected', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'setup-test-'))

    mockedIsExistingBrain.mockReturnValue(true)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedSelect.mockResolvedValue('brain')
    mockedCheckbox.mockResolvedValue([])

    mockedDetectAll.mockResolvedValue([
      { name: 'Claude', detected: true, configHint: '~/.claude' }
    ] as DetectedPlatform[])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Existing brain detected'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should run fresh setup for new brain', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedIsInstallationComplete.mockReturnValue(true)
    mockedGlobalVenvExists.mockReturnValue(true)

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledTimes(1)
    expect(mockedSelect).toHaveBeenCalledTimes(3)
    expect(mockedCreateBrain).toHaveBeenCalledWith({
      name: 'ai-brain',
      basePath: expect.any(String) as string,
      includeObsidian: false,
      obsidianDir: null,
      gitSync: false,
      useGit: false,
      gitRemote: undefined
    })
  })

  it('should handle custom location choice', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('custom')
    mockedInput.mockResolvedValueOnce('/custom/path')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledTimes(2)
    expect(mockedCreateBrain).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: '/custom/path'
      })
    )
  })

  it('should handle git mode with remote', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('git')
    mockedInput.mockResolvedValueOnce('https://github.com/repo')
    mockedConfirm.mockResolvedValueOnce(true)
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedInitRepo).not.toHaveBeenCalled()
    expect(mockedWriteGitignore).not.toHaveBeenCalled()
    expect(mockedCreateBrain).toHaveBeenCalledWith(
      expect.objectContaining({
        useGit: true,
        gitRemote: 'https://github.com/repo',
        gitSync: true
      })
    )
  })

  it('should handle extras selection', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedIsInstallationComplete.mockReturnValue(true)
    mockedGlobalVenvExists.mockReturnValue(true)

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedSelect).toHaveBeenCalledTimes(3)
  })

  it('should handle obsidian brain folder choice', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('brain')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedCreateBrain).toHaveBeenCalledWith(
      expect.objectContaining({
        includeObsidian: true,
        obsidianDir: null
      })
    )
  })

  it('should handle obsidian separate vault choice', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('separate')
    mockedInput.mockResolvedValueOnce('/vault/path')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledTimes(2)
    expect(mockedCreateBrain).toHaveBeenCalledWith(
      expect.objectContaining({
        includeObsidian: true,
        obsidianDir: '/vault/path'
      })
    )
  })

  it('should handle duplicate brain id by prompting again', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledTimes(1)
    expect(mockedSelect).toHaveBeenCalledTimes(3)
  })

  it('should print summary at end of fresh setup', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Setup complete'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Next steps'))
  })

  it('should print summary with git and obsidian details', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedIsInstallationComplete.mockReturnValue(true)
    mockedGlobalVenvExists.mockReturnValue(true)

    mockedInput.mockResolvedValueOnce('ai-brain') // folder name
    mockedSelect.mockResolvedValueOnce('current') // location
    mockedSelect.mockResolvedValueOnce('git') // git mode
    mockedInput.mockResolvedValueOnce('https://github.com/repo') // remote URL
    mockedConfirm.mockResolvedValueOnce(true) // commit cache
    mockedConfirm.mockResolvedValueOnce(true) // git sync
    mockedDetectAll.mockResolvedValue([
      { name: 'Claude', detected: true, configHint: '~/.claude' }
    ] as DetectedPlatform[])
    mockedSelect.mockResolvedValueOnce('brain') // obsidian

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Setup complete'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('git'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('enabled'))
  })

  it('should print summary without remote when git local only', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('git')
    mockedInput.mockResolvedValueOnce('')
    mockedConfirm.mockResolvedValueOnce(false)
    mockedConfirm.mockResolvedValueOnce(false)
    mockedDetectAll.mockResolvedValue([])
    mockedSelect.mockResolvedValueOnce('skip')

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Setup complete'))
  })

  it('should handle config parse error in new machine setup', async () => {
    mockedIsExistingBrain.mockReturnValue(true)
    mockedWriteFileSync.mockImplementation(() => {})

    const badJson = '{ invalid json }'
    vi.mocked(await import('fs')).readFileSync.mockReturnValue(badJson as never)

    mockedSelect.mockResolvedValue('brain')
    mockedCheckbox.mockResolvedValue([])

    mockedDetectAll.mockResolvedValue([
      { name: 'Claude', detected: true, configHint: '~/.claude' }
    ] as DetectedPlatform[])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await expect(run()).resolves.not.toThrow()
  })

  it('should handle separate obsidian vault path', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('separate')
    mockedInput.mockResolvedValueOnce('/my/vault')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Path to your Obsidian vault:' })
    )
  })

  it('should propagate error when ensureUv fails during installation', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedIsInstallationComplete.mockReturnValue(false)
    mockedGlobalVenvExists.mockReturnValue(true)

    mockedEnsureUv.mockRejectedValue(new Error('uv install failed'))

    await expect(run()).rejects.toThrow('uv install failed')
  })

  it('should propagate error when createGlobalVenv fails during installation', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedIsInstallationComplete.mockReturnValue(false)
    mockedGlobalVenvExists.mockReturnValue(true)

    mockedEnsureUv.mockResolvedValue(undefined)
    mockedCreateGlobalVenv.mockRejectedValue(new Error('venv creation failed'))

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})

    await expect(run()).rejects.toThrow('venv creation failed')
  })

  it('should fall back to detected tools when readConfig fails in freshSetup', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedIsInstallationComplete.mockReturnValue(true)
    mockedGlobalVenvExists.mockReturnValue(true)

    mockedReadConfig.mockImplementationOnce(() => {
      throw new Error('Config parse error')
    })

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([
      { name: 'Claude', key: 'claude', detected: true, configHint: '~/.claude' }
    ] as DetectedPlatform[])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)
    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Claude'))
  })

  it('should fall back to detected tools when readConfig fails in newMachineSetup', async () => {
    mockedIsExistingBrain.mockReturnValue(true)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedReadConfig.mockImplementation(() => {
      throw new Error('Config parse error')
    })

    mockedDetectAll.mockResolvedValue([
      { name: 'Codex', key: 'codex', detected: true, configHint: '~/.codex' }
    ] as DetectedPlatform[])

    mockedSelect.mockResolvedValue('brain')
    mockedCheckbox.mockResolvedValue([])
    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)
    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('codex'))
  })

  it('should propagate error when createBrainMCP fails in freshSetup', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('git')
    mockedInput.mockResolvedValueOnce('')
    mockedConfirm.mockResolvedValueOnce(false)
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([
      {
        name: 'Claude',
        detected: true,
        key: 'claude',
        module: { patch: vi.fn(), installAlwaysOn: vi.fn() },
        configHint: '~/.claude'
      }
    ] as unknown as DetectedPlatform[])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)
    mockedCreateVenv.mockResolvedValue()

    const testError = new Error('MCP config failed')
    mockedCreateBrain.mockRejectedValueOnce(testError)

    await expect(run()).rejects.toThrow('MCP config failed')
  })

  it('should propagate error when createBrainMCP fails in newMachineSetup', async () => {
    mockedIsExistingBrain.mockReturnValue(true)
    mockedWriteFileSync.mockImplementation(() => {})
    mockedReadConfig.mockReturnValue({
      aiTools: ['claude'],
      installationComplete: true,
      graphifyyExtras: [],
      brains: {}
    })

    mockedDetectAll.mockResolvedValue([
      {
        name: 'Claude',
        detected: true,
        key: 'claude',
        module: { patch: vi.fn(), installAlwaysOn: vi.fn() },
        configHint: '~/.claude'
      }
    ] as unknown as DetectedPlatform[])

    mockedSelect.mockResolvedValue('brain')
    mockedCheckbox.mockResolvedValue([])
    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)
    mockedCreateVenv.mockResolvedValue()

    const testError = new Error('MCP config failed')
    mockedCreateBrainMCP.mockRejectedValueOnce(testError)

    await expect(run()).rejects.toThrow('MCP config failed')
  })

  it('should run installation with skipPrompts when nonInteractive is true', async () => {
    mockedEnsureUv.mockResolvedValue()
    mockedCreateGlobalVenv.mockResolvedValue()

    await run({ nonInteractive: true })

    expect(mockedCreateGlobalVenv).toHaveBeenCalledWith([])
    // confirm prompts should never be called in non-interactive mode
    expect(mockedConfirm).not.toHaveBeenCalled()
  })

  it('should warn when duplicate brain id is entered', async () => {
    mockedIsExistingBrain.mockReturnValue(true)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedIsBrainIdAvailable.mockReturnValueOnce(false).mockReturnValueOnce(true)
    mockedInput.mockResolvedValueOnce('duplicate')
    mockedInput.mockResolvedValueOnce('unique')
    mockedSelect.mockResolvedValue('brain')
    mockedCheckbox.mockResolvedValue([])

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedCreateVenv.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('already taken'))
    expect(mockedInput).toHaveBeenCalledTimes(2)
  })

  it('should handle brain creation failure', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)
    mockedCreateVenv.mockResolvedValue()

    mockedCreateBrain.mockRejectedValueOnce(new Error('Brain creation failed'))

    await expect(run()).rejects.toThrow('Brain creation failed')
  })
})
