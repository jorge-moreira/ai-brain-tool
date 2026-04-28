import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { run } from '../../../src/commands/update'
import { getBrainPath, readBrainConfig, type BrainConfig } from '@ai-brain/core/config'
import { execa, type Result } from 'execa'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s)
  }
}))

vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis()
  })
}))

vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}))

vi.mock('@ai-brain/core/config', () => ({
  getBrainPath: vi.fn<typeof getBrainPath>(),
  readBrainConfig: vi.fn<typeof readBrainConfig>()
}))

vi.mock('@ai-brain/core/graphify', () => ({
  runGraphify: vi.fn().mockResolvedValue(undefined)
}))

const mockedGetBrainPath = getBrainPath as Mock<typeof getBrainPath>
const mockedReadBrainConfig = readBrainConfig as Mock<typeof readBrainConfig>
const mockedExeca = execa as unknown as Mock<
  (command: string, args: readonly string[], options?: { cwd?: string }) => Promise<Result>
>

describe('commands/update', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should resolve brain from id argument', async () => {
    mockedGetBrainPath.mockReturnValue('/tmp/work')
    mockedReadBrainConfig.mockImplementation(() => ({ gitSync: false }) as BrainConfig)

    await run(['work'], {})

    expect(mockedGetBrainPath).toHaveBeenCalledWith(['work'], {})
  })

  it('should resolve brain from options.brainId', async () => {
    mockedGetBrainPath.mockReturnValue('/tmp/work')
    mockedReadBrainConfig.mockImplementation(() => ({ gitSync: false }) as BrainConfig)

    await run([], { brainId: 'work' })

    expect(mockedGetBrainPath).toHaveBeenCalledWith([], { brainId: 'work' })
  })

  it('should print brain id in success message', async () => {
    mockedGetBrainPath.mockReturnValue('/tmp/work')
    mockedReadBrainConfig.mockImplementation(() => ({ gitSync: false }) as BrainConfig)

    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('work'))
  })

  it('should throw when brain not found', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('Brain "nonexistent" not found')
    })

    await expect(run(['nonexistent'], {})).rejects.toThrow()
  })

  it('should throw when no brain configured', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('No brain configured')
    })

    await expect(run(['work'], {})).rejects.toThrow('No brain configured')
  })

  it('should skip git sync when gitSync is false', async () => {
    mockedGetBrainPath.mockReturnValue('/tmp/work')
    mockedReadBrainConfig.mockImplementation(() => ({ gitSync: false }) as BrainConfig)

    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))
  })

  it('should warn when gitSync enabled but no git repo', async () => {
    mockedGetBrainPath.mockReturnValue('/tmp/work')
    mockedReadBrainConfig.mockImplementation(() => ({ gitSync: true }) as BrainConfig)

    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('git repository found'))
  })

  it('should commit and push when gitSync enabled and git repo exists', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'update-git-'))
    mkdirSync(join(tmp, '.git'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedReadBrainConfig.mockImplementation(() => ({ gitSync: true }) as BrainConfig)
    mockedExeca.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '' } as Result))

    await run(['work'], {})

    expect(mockedExeca).toHaveBeenCalledWith('git', ['add', '.'], { cwd: tmp })
    expect(mockedExeca).toHaveBeenCalledWith('git', ['commit', '-m', expect.any(String)], {
      cwd: tmp
    })
    expect(mockedExeca).toHaveBeenCalledWith('git', ['push'], { cwd: tmp })

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should warn when git commit fails', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'update-git-fail-'))
    mkdirSync(join(tmp, '.git'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedReadBrainConfig.mockImplementation(() => ({ gitSync: true }) as BrainConfig)
    mockedExeca
      .mockImplementationOnce(() => Promise.resolve({ stdout: 'some diff', stderr: '' } as Result))
      .mockImplementationOnce(() => Promise.resolve({ stdout: '', stderr: '' } as Result))
      .mockImplementationOnce(() => Promise.reject(new Error('commit failed')))
      .mockImplementation(() => Promise.resolve({ stdout: '', stderr: '' } as Result))

    await run(['work'], {})

    expect(mockedExeca).toHaveBeenCalledTimes(3)

    rmSync(tmp, { recursive: true, force: true })
  })

  describe('getCommitMessage', () => {
    it('should return default message when no changes', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'commit-msg-'))

      mockedGetBrainPath.mockReturnValue(tmp)
      mockedReadBrainConfig.mockImplementation(() => ({ gitSync: true }) as BrainConfig)
      mkdirSync(join(tmp, '.git'), { recursive: true })
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '' } as Result))

      await run(['work'], {})

      const commitCall = mockedExeca.mock.calls.find(c => c[0] === 'git' && c[1]?.[0] === 'commit')
      if (!commitCall) throw new Error('commit call not found')
      expect(commitCall[1][2]).toBe('Update AI brain')

      rmSync(tmp, { recursive: true, force: true })
    })

    it('should extract file names from git diff output', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'commit-diff-'))
      mkdirSync(join(tmp, '.git'), { recursive: true })

      mockedGetBrainPath.mockReturnValue(tmp)
      mockedReadBrainConfig.mockImplementation(() => ({ gitSync: true }) as BrainConfig)
      mockedExeca.mockImplementation(() =>
        Promise.resolve({
          stdout: ' raw/file1.js | 5 +-\n raw/file2.md | 3 +-\n',
          stderr: ''
        } as Result)
      )

      await run(['work'], {})

      const commitCall = mockedExeca.mock.calls.find(c => c[0] === 'git' && c[1]?.[0] === 'commit')
      if (!commitCall) throw new Error('commit call not found')
      expect(commitCall[1][2]).toContain('file1.js')
      expect(commitCall[1][2]).toContain('file2.md')

      rmSync(tmp, { recursive: true, force: true })
    })

    it('should limit to 3 files in commit message', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'commit-limit-'))
      mkdirSync(join(tmp, '.git'), { recursive: true })

      mockedGetBrainPath.mockReturnValue(tmp)
      mockedReadBrainConfig.mockImplementation(() => ({ gitSync: true }) as BrainConfig)
      mockedExeca.mockImplementation(() =>
        Promise.resolve({
          stdout: ' raw/a.js |\n raw/b.js |\n raw/c.js |\n raw/d.js |\n raw/e.js |',
          stderr: ''
        } as Result)
      )

      await run(['work'], {})

      const commitCall = mockedExeca.mock.calls.find(c => c[0] === 'git' && c[1]?.[0] === 'commit')
      if (!commitCall) throw new Error('commit call not found')
      expect(commitCall[1][2]).toContain('a.js')
      expect(commitCall[1][2]).toContain('b.js')
      expect(commitCall[1][2]).toContain('c.js')
      expect(commitCall[1][2]).not.toContain('d.js')

      rmSync(tmp, { recursive: true, force: true })
    })
  })
})
