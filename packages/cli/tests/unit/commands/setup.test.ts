import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mkdtempSync, rmSync, existsSync, writeFileSync, PathLike } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { select, checkbox, input, confirm } from '@inquirer/prompts'
import { createBrainFolder } from '@ai-brain/core/scaffold'
import { createVenv } from '@ai-brain/core/graphify'
import { detectAll, type DetectedPlatform } from '@ai-brain/core/index'
import { initRepo, writeGitignore } from '@ai-brain/core/git'
import { configPath, ensureConfigDir, isBrainIdAvailable } from '@ai-brain/core/config'
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
    succeed: vi.fn()
  }))
}))

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn<typeof input>(),
  select: vi.fn<typeof select>(),
  checkbox: vi.fn<typeof checkbox>(),
  confirm: vi.fn<typeof confirm>()
}))

vi.mock('@ai-brain/core/scaffold', () => ({
  createBrainFolder: vi.fn<typeof createBrainFolder>(),
  writeBrainConfig: vi.fn()
}))

vi.mock('@ai-brain/core/graphify', () => ({
  createVenv: vi.fn<typeof createVenv>(),
  venvExists: vi.fn()
}))

vi.mock('@ai-brain/core/index', () => ({
  detectAll: vi.fn().mockResolvedValue([]),
  configureSelected: vi.fn()
}))

vi.mock('@ai-brain/core/git', () => ({
  initRepo: vi.fn<typeof initRepo>(),
  writeGitignore: vi.fn()
}))

vi.mock('@ai-brain/core/config', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  addBrain: vi.fn(),
  ensureConfigDir: vi.fn(),
  configPath: vi.fn(),
  isBrainIdAvailable: vi.fn()
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
const mockedCreateBrainFolder = createBrainFolder as Mock<typeof createBrainFolder>
const mockedCreateVenv = createVenv as Mock<typeof createVenv>
const mockedDetectAll = detectAll as unknown as Mock<typeof detectAll>
const mockedConfigPath = configPath as Mock<typeof configPath>
const mockedEnsureConfigDir = ensureConfigDir as Mock<typeof ensureConfigDir>
const mockedIsBrainIdAvailable = isBrainIdAvailable as Mock<typeof isBrainIdAvailable>
const mockedInitRepo = initRepo as Mock<typeof initRepo>
const mockedWriteGitignore = writeGitignore as Mock<typeof writeGitignore>
const mockedExistsSync = existsSync as Mock<typeof existsSync>
const mockedWriteFileSync = writeFileSync as Mock<typeof writeFileSync>

describe('commands/setup', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(async () => {
    vi.clearAllMocks()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should run new machine setup when existing brain detected', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'setup-test-'))

    mockedExistsSync.mockImplementation((path: PathLike) => {
      const markers = ['raw', '.graphifyignore', '.brain-config.json']
      return markers.some(m => path.toString().includes(m))
    })

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
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Existing brain detected'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should run fresh setup for new brain', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedCheckbox.mockResolvedValueOnce([])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledTimes(2)
    expect(mockedSelect).toHaveBeenCalledTimes(3)
    expect(mockedCheckbox).toHaveBeenCalledTimes(2)
  })

  it('should handle custom location choice', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('custom')
    mockedInput.mockResolvedValueOnce('/custom/path')
    mockedSelect.mockResolvedValueOnce('local')
    mockedCheckbox.mockResolvedValueOnce([])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledTimes(3)

    rmSync('/custom/path/ai-brain', { recursive: true, force: true })
  })

  it('should handle git mode with remote', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('git')
    mockedInput.mockResolvedValueOnce('https://github.com/repo')
    mockedConfirm.mockResolvedValueOnce(true)
    mockedConfirm.mockResolvedValueOnce(true)
    mockedCheckbox.mockResolvedValueOnce([])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedInitRepo.mockResolvedValue()
    mockedWriteGitignore.mockResolvedValue()

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(mockedInitRepo).toHaveBeenCalledTimes(1)
    expect(mockedWriteGitignore).toHaveBeenCalledTimes(1)
  })

  it('should handle extras selection', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedCheckbox.mockResolvedValueOnce(['office', 'video'])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    const checkboxCall = mockedCheckbox.mock.calls[0] as unknown as [
      { message: string; choices?: unknown[] }
    ]
    expect(checkboxCall?.[0].message).toContain('file types')
  })

  it('should handle obsidian brain folder choice', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedCheckbox.mockResolvedValueOnce([])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('brain')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(mockedCreateBrainFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        includeObsidian: true
      })
    )
  })

  it('should handle obsidian separate vault choice', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedCheckbox.mockResolvedValueOnce([])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('separate')
    mockedInput.mockResolvedValueOnce('/vault/path')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(mockedInput).toHaveBeenCalledTimes(3)
  })

  it('should handle duplicate brain id by prompting again', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedCheckbox.mockResolvedValueOnce([])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('skip')
    mockedInput.mockResolvedValueOnce('duplicate')
    mockedInput.mockResolvedValueOnce('unique')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValueOnce(false).mockReturnValueOnce(true)

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(mockedIsBrainIdAvailable).toHaveBeenCalledTimes(2)
  })

  it('should print summary at end of fresh setup', async () => {
    mockedExistsSync.mockReturnValue(false)
    mockedWriteFileSync.mockImplementation(() => {})

    mockedInput.mockResolvedValueOnce('ai-brain')
    mockedSelect.mockResolvedValueOnce('current')
    mockedSelect.mockResolvedValueOnce('local')
    mockedCheckbox.mockResolvedValueOnce([])
    mockedCheckbox.mockResolvedValueOnce([])
    mockedSelect.mockResolvedValueOnce('skip')

    mockedDetectAll.mockResolvedValue([])

    mockedConfigPath.mockReturnValue('/fake/config/path')
    mockedEnsureConfigDir.mockImplementation(() => {})
    mockedIsBrainIdAvailable.mockReturnValue(true)

    mockedCreateVenv.mockResolvedValue()
    mockedCreateBrainFolder.mockResolvedValue()

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Setup complete'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Next steps'))
  })
})
