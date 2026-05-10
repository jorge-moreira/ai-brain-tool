import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { run } from '../../../src/commands/update'
import { getBrainPath } from '@ai-brain/core/config'
import { updateBrain } from '@ai-brain/core/update'
import { GraphifyError, GitSyncError } from '@ai-brain/core/errors'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s)
  }
}))

const spinnerMock = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  warn: vi.fn().mockReturnThis()
}

vi.mock('ora', () => ({
  default: vi.fn(() => spinnerMock)
}))

vi.mock('@ai-brain/core/config', () => ({
  getBrainPath: vi.fn<typeof getBrainPath>()
}))

vi.mock('@ai-brain/core/update', () => ({
  updateBrain: vi.fn().mockResolvedValue({ gitSync: 'skipped' })
}))

const mockedGetBrainPath = getBrainPath as Mock<typeof getBrainPath>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedUpdateBrain = updateBrain as unknown as Mock<(...args: any[]) => Promise<any>>

describe('commands/update', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.clearAllMocks()
    spinnerMock.start.mockReturnThis()
    spinnerMock.succeed.mockReturnThis()
    spinnerMock.fail.mockReturnThis()
    spinnerMock.warn.mockReturnThis()
    mockedGetBrainPath.mockReturnValue('/tmp/work')
    mockedUpdateBrain.mockResolvedValue({ gitSync: 'skipped' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should resolve brain from id argument', async () => {
    await run(['work'], {})
    expect(mockedGetBrainPath).toHaveBeenCalledWith(['work'], {})
  })

  it('should resolve brain from options.brainId', async () => {
    await run([], { brainId: 'work' })
    expect(mockedGetBrainPath).toHaveBeenCalledWith([], { brainId: 'work' })
  })

  it('should call updateBrain with resolved brainPath', async () => {
    await run(['work'], {})
    expect(mockedUpdateBrain).toHaveBeenCalledWith('/tmp/work')
  })

  it('should print brain id in success message', async () => {
    mockedGetBrainPath.mockReturnValue('/tmp/work')
    await run(['work'], {})
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('work'))
  })

  it('should show success spinner and message when gitSync is skipped', async () => {
    mockedUpdateBrain.mockResolvedValue({ gitSync: 'skipped' })
    await run(['work'], {})
    expect(spinnerMock.succeed).toHaveBeenCalledWith('Knowledge graph rebuilt')
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))
  })

  it('should show pushed succeed when gitSync is ok', async () => {
    mockedUpdateBrain.mockResolvedValue({ gitSync: 'ok' })
    await run(['work'], {})
    expect(spinnerMock.succeed).toHaveBeenCalledWith(expect.stringContaining('Pushed'))
  })

  it('should warn when gitSync is failed', async () => {
    const gitError = new GitSyncError('no-remote', 'no remote')
    mockedUpdateBrain.mockResolvedValue({ gitSync: 'failed', gitSyncError: gitError })
    await run(['work'], {})
    expect(spinnerMock.warn).toHaveBeenCalledWith(expect.stringContaining('no-remote'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))
  })

  it('should fail spinner and throw when GraphifyError is thrown', async () => {
    mockedUpdateBrain.mockRejectedValue(new GraphifyError('process-failed', 'graphify boom'))
    await expect(run(['work'], {})).rejects.toBeInstanceOf(GraphifyError)
    expect(spinnerMock.fail).toHaveBeenCalledWith(expect.stringContaining('process-failed'))
  })

  it('should fail spinner and rethrow unexpected errors', async () => {
    mockedUpdateBrain.mockRejectedValue(new Error('unexpected'))
    await expect(run(['work'], {})).rejects.toThrow('unexpected')
    expect(spinnerMock.fail).toHaveBeenCalled()
  })

  it('should throw when getBrainPath throws', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('Brain not found')
    })
    await expect(run(['nonexistent'], {})).rejects.toThrow('Brain not found')
  })
})
