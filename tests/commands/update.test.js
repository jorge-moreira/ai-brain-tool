import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
    green: vi.fn((s) => s)
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
  execa: vi.fn()
}))

vi.mock('../../src/graphify.js', () => ({
  runGraphify: vi.fn().mockResolvedValue(undefined)
}))

describe('commands/update', () => {
  let getBrainPathSpy, readBrainConfigSpy, consoleLogSpy, execaMock

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const config = await import('../../src/config.js')
    getBrainPathSpy = vi.spyOn(config, 'getBrainPath')
    readBrainConfigSpy = vi.spyOn(config, 'readBrainConfig')
    execaMock = (await import('execa')).execa
    execaMock.mockReset()
  })

  afterEach(() => vi.resetAllMocks())

  it('should resolve brain from id argument', async () => {
    getBrainPathSpy.mockReturnValue('/tmp/work')
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(getBrainPathSpy).toHaveBeenCalledWith(['work'], {})
  })

  it('should resolve brain from options.brainId', async () => {
    getBrainPathSpy.mockReturnValue('/tmp/work')
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run([], { brainId: 'work' })

    expect(getBrainPathSpy).toHaveBeenCalledWith([], { brainId: 'work' })
  })

  it('should print brain id in success message', async () => {
    getBrainPathSpy.mockReturnValue('/tmp/work')
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('work'))
  })

  it('should throw when brain not found', async () => {
    getBrainPathSpy.mockImplementation(() => {
      throw new Error('Brain "nonexistent" not found')
    })

    const { run } = await import('../../src/commands/update.js')
    await expect(run(['nonexistent'], {})).rejects.toThrow()
  })

  it('should throw when no brain configured', async () => {
    getBrainPathSpy.mockImplementation(() => { throw new Error('No brain configured') })

    const { run } = await import('../../src/commands/update.js')
    await expect(run(['work'], {})).rejects.toThrow('No brain configured')
  })

  it('should skip git sync when gitSync is false', async () => {
    getBrainPathSpy.mockReturnValue('/tmp/work')
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))
  })

  it('should warn when gitSync enabled but no git repo', async () => {
    getBrainPathSpy.mockReturnValue('/tmp/work')
    readBrainConfigSpy.mockReturnValue({ gitSync: true })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('git repository found')
    )
  })

  it('should commit and push when gitSync enabled and git repo exists', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'update-git-'))
    mkdirSync(join(tmp, '.git'), { recursive: true })
    
    getBrainPathSpy.mockReturnValue(tmp)
    readBrainConfigSpy.mockReturnValue({ gitSync: true })
    execaMock.mockResolvedValue({ stdout: '', stderr: '' })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(execaMock).toHaveBeenCalledWith('git', ['add', '.'], { cwd: tmp })
    expect(execaMock).toHaveBeenCalledWith('git', ['commit', '-m', expect.any(String)], { cwd: tmp })
    expect(execaMock).toHaveBeenCalledWith('git', ['push'], { cwd: tmp })
    
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should warn when git commit fails', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'update-git-fail-'))
    mkdirSync(join(tmp, '.git'), { recursive: true })
    
    getBrainPathSpy.mockReturnValue(tmp)
    readBrainConfigSpy.mockReturnValue({ gitSync: true })
    execaMock.mockResolvedValueOnce({ stdout: 'some diff', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockRejectedValueOnce(new Error('commit failed'))
      .mockResolvedValue({ stdout: '', stderr: '' })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    // Test passes if no error is thrown and function completes (commit error is caught)
    expect(execaMock).toHaveBeenCalledTimes(3)
    
    rmSync(tmp, { recursive: true, force: true })
  })

  describe('getCommitMessage', () => {
    it('should return default message when no changes', async () => {
      execaMock.mockResolvedValue({ stdout: '', stderr: '' })
      const tmp = mkdtempSync(join(tmpdir(), 'commit-msg-'))
      
      const { run } = await import('../../src/commands/update.js')
      getBrainPathSpy.mockReturnValue(tmp)
      readBrainConfigSpy.mockReturnValue({ gitSync: true })
      mkdirSync(join(tmp, '.git'), { recursive: true })
      execaMock.mockResolvedValue({ stdout: '', stderr: '' })
      
      await run(['work'], {})
      
      const commitCall = execaMock.mock.calls.find(c => c[0] === 'git' && c[1]?.[0] === 'commit')
      expect(commitCall[1][2]).toBe('Update AI brain')
      
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should extract file names from git diff output', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'commit-diff-'))
      mkdirSync(join(tmp, '.git'), { recursive: true })
      
      getBrainPathSpy.mockReturnValue(tmp)
      readBrainConfigSpy.mockReturnValue({ gitSync: true })
      execaMock.mockResolvedValue({ stdout: ' raw/file1.js | 5 +-\n raw/file2.md | 3 +-\n', stderr: '' })

      const { run } = await import('../../src/commands/update.js')
      await run(['work'], {})

      const commitCall = execaMock.mock.calls.find(c => c[0] === 'git' && c[1]?.[0] === 'commit')
      expect(commitCall[1][2]).toContain('file1.js')
      expect(commitCall[1][2]).toContain('file2.md')
      
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should limit to 3 files in commit message', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'commit-limit-'))
      mkdirSync(join(tmp, '.git'), { recursive: true })
      
      getBrainPathSpy.mockReturnValue(tmp)
      readBrainConfigSpy.mockReturnValue({ gitSync: true })
      execaMock.mockResolvedValue({ stdout: ' raw/a.js |\n raw/b.js |\n raw/c.js |\n raw/d.js |\n raw/e.js |', stderr: '' })

      const { run } = await import('../../src/commands/update.js')
      await run(['work'], {})

      const commitCall = execaMock.mock.calls.find(c => c[0] === 'git' && c[1]?.[0] === 'commit')
      expect(commitCall[1][2]).toContain('a.js')
      expect(commitCall[1][2]).toContain('b.js')
      expect(commitCall[1][2]).toContain('c.js')
      expect(commitCall[1][2]).not.toContain('d.js')
      
      rmSync(tmp, { recursive: true, force: true })
    })
  })
})