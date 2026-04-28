import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import * as fs from 'fs'
import { getBrainPath } from '@ai-brain/core/config'
import { upgradeVenv } from '@ai-brain/core/graphify'
import { run } from '../../../src/commands/upgrade'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s)
  }
}))

vi.mock('fs', () => ({
  mkdtempSync: vi.fn(),
  rmSync: vi.fn(),
  readFileSync: vi.fn(),
  cpSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn()
}))

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn()
  }))
}))

vi.mock('@ai-brain/core/config', () => ({
  getBrainPath: vi.fn<typeof getBrainPath>()
}))

vi.mock('@ai-brain/core/graphify', () => ({
  upgradeVenv: vi.fn<typeof upgradeVenv>()
}))

const mockedGetBrainPath = getBrainPath as Mock<typeof getBrainPath>
const mockedUpgradeVenv = upgradeVenv as Mock<typeof upgradeVenv>
const mockedReadFileSync = fs.readFileSync as unknown as Mock<typeof fs.readFileSync>
const mockedCpSync = fs.cpSync as unknown as Mock<typeof fs.cpSync>
const mockedMkdtempSync = fs.mkdtempSync as unknown as Mock<typeof fs.mkdtempSync>

describe('commands/upgrade', () => {
  let consoleLogSpy: Mock<Console['log']>
  let consoleErrorSpy: Mock<Console['error']>
  let processExitSpy: Mock<typeof process.exit>

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called')
    }) as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should exit with error when brain cannot be resolved', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('No brain configured')
    })

    await run([], {}).catch(() => {})

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No brain configured'))
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })

  it('should upgrade graphify without extras when no brain config', async () => {
    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedReadFileSync.mockImplementation(() => {
      throw new Error('File not found')
    })

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedUpgradeVenv.mockResolvedValue()

    await run([], {})

    expect(mockedUpgradeVenv).toHaveBeenCalledWith(tmp, [])
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
  })

  it('should upgrade graphify with extras from brain config', async () => {
    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedReadFileSync.mockReturnValue(JSON.stringify({ extras: ['office', 'video'] }))

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedUpgradeVenv.mockResolvedValue()

    await run([], {})

    expect(mockedUpgradeVenv).toHaveBeenCalledWith(tmp, ['office', 'video'])
  })

  it('should copy bundled templates', async () => {
    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedReadFileSync.mockReturnValue(JSON.stringify({ extras: [] }))

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedUpgradeVenv.mockResolvedValue()

    await run([], {})

    expect(mockedCpSync).toHaveBeenCalledWith(
      expect.stringContaining('_bundled'),
      expect.stringContaining('_bundled'),
      expect.objectContaining({ recursive: true, force: true })
    )
  })

  it('should accept brain-id from args', async () => {
    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedReadFileSync.mockReturnValue(JSON.stringify({ extras: [] }))

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedUpgradeVenv.mockResolvedValue()

    await run(['my-brain'], {})

    expect(mockedGetBrainPath).toHaveBeenCalledWith(['my-brain'], {})
  })

  it('should accept brain-id from options', async () => {
    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedReadFileSync.mockReturnValue(JSON.stringify({ extras: [] }))

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedUpgradeVenv.mockResolvedValue()

    await run([], { brainId: 'option-brain' })

    expect(mockedGetBrainPath).toHaveBeenCalledWith([], { brainId: 'option-brain' })
  })

  it('should handle empty extras array', async () => {
    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedReadFileSync.mockReturnValue(JSON.stringify({}))

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedUpgradeVenv.mockResolvedValue()

    await run([], {})

    expect(mockedUpgradeVenv).toHaveBeenCalledWith(tmp, [])
  })
})
