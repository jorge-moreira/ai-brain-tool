import { describe, it, expect, afterEach, vi, beforeEach, type Mock } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execa } from 'execa'
import { writeGitignore, initRepo, syncBrain } from '@ai-brain/core/git'
import { GitSyncError } from '@ai-brain/core/errors'

vi.mock('execa', () => ({
  execa: vi.fn(() => Promise.resolve({ stdout: '', stderr: '' }))
}))

vi.mock('@ai-brain/core/config', () => ({
  readBrainConfig: vi.fn(() => ({ gitSync: false }))
}))

vi.mock('fs', async importOriginal => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync)
  }
})

describe('git', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    // Cleanup handled in each test
  })

  it('should create .gitignore with no cache line when commitCache is true', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    await writeGitignore({ brainPath: tmp, commitCache: true })
    const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
    expect(content.includes('.venv/')).toBe(true)
    expect(content.includes('graphify-out/.graphify_*')).toBe(true)
    expect(content.includes('graphify-out/cache/')).toBe(false)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should add graphify-out/cache/ to .gitignore when commitCache is false', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    await writeGitignore({ brainPath: tmp, commitCache: false })
    const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
    expect(content.includes('graphify-out/cache/')).toBe(true)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should add remote origin when remoteUrl is provided', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))

    await initRepo({ brainPath: tmp, remoteUrl: 'https://github.com/user/repo.git' })

    expect(execa).toHaveBeenCalledWith('git', ['init'], { cwd: tmp })
    expect(execa).toHaveBeenCalledWith(
      'git',
      ['remote', 'add', 'origin', 'https://github.com/user/repo.git'],
      { cwd: tmp }
    )
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should init repo without remote when remoteUrl is not provided', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))

    await initRepo({ brainPath: tmp, remoteUrl: undefined })

    expect(execa).toHaveBeenCalledWith('git', ['init'], { cwd: tmp })
    expect(execa).not.toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['remote']),
      expect.anything()
    )
    rmSync(tmp, { recursive: true, force: true })
  })
})

describe('syncBrain', () => {
  let readBrainConfigMock: ReturnType<typeof vi.fn>
  let existsSyncMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetAllMocks()
    // Re-mock fs and config after reset
    const fsMod = await import('fs')
    const configMod = await import('@ai-brain/core/config')
    readBrainConfigMock = configMod.readBrainConfig as ReturnType<typeof vi.fn>
    existsSyncMock = fsMod.existsSync as ReturnType<typeof vi.fn>
  })

  it('should return skipped when gitSync is false', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: false })
    existsSyncMock.mockReturnValue(true)

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('skipped')
    expect(result.error).toBeUndefined()
    expect(execa).not.toHaveBeenCalled()
  })

  it('should return skipped when .git dir does not exist', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: true })
    existsSyncMock.mockReturnValue(false)

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('skipped')
    expect(result.error).toBeUndefined()
    expect(execa).not.toHaveBeenCalled()
  })

  it('should return ok and call git add, commit, push when gitSync=true and .git exists', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: true })
    existsSyncMock.mockReturnValue(true)
    ;(execa as unknown as Mock).mockResolvedValue({ stdout: '', stderr: '' })

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('ok')
    expect(result.error).toBeUndefined()
    expect(execa).toHaveBeenCalledWith('git', ['add', '.'], { cwd: '/fake/brain' })
    expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', expect.any(String)], {
      cwd: '/fake/brain'
    })
    expect(execa).toHaveBeenCalledWith('git', ['push'], { cwd: '/fake/brain' })
  })

  it('should use commit message from diff output', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: true })
    existsSyncMock.mockReturnValue(true)
    ;(execa as unknown as Mock)
      .mockResolvedValueOnce({ stdout: ' raw/file1.md | 5 +-\n', stderr: '' })
      .mockResolvedValue({ stdout: '', stderr: '' })

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('ok')
    const commitCall = (execa as unknown as Mock).mock.calls.find(
      (c: unknown[]) =>
        Array.isArray(c) && c[0] === 'git' && Array.isArray(c[1]) && c[1][0] === 'commit'
    ) as [string, string[], Record<string, unknown>] | undefined
    expect(commitCall?.[1][2]).toContain('file1.md')
  })

  it('should return failed with no-remote code when push fails with no remote message', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: true })
    existsSyncMock.mockReturnValue(true)
    ;(execa as unknown as Mock)
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git diff
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git add
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git commit
      .mockRejectedValueOnce(new Error("fatal: 'origin' does not appear to be a git repository"))

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('failed')
    expect(result.error).toBeInstanceOf(GitSyncError)
    expect(result.error?.code).toBe('no-remote')
  })

  it('should return failed with nothing-to-commit code when commit has nothing to commit', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: true })
    existsSyncMock.mockReturnValue(true)
    ;(execa as unknown as Mock)
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git diff
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git add
      .mockRejectedValueOnce(new Error('nothing to commit, working tree clean'))

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('failed')
    expect(result.error).toBeInstanceOf(GitSyncError)
    expect(result.error?.code).toBe('nothing-to-commit')
  })

  it('should return failed with push-failed code when push fails for unknown reason', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: true })
    existsSyncMock.mockReturnValue(true)
    ;(execa as unknown as Mock)
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git diff
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git add
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git commit
      .mockRejectedValueOnce(new Error('error: failed to push some refs'))

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('failed')
    expect(result.error).toBeInstanceOf(GitSyncError)
    expect(result.error?.code).toBe('push-failed')
  })

  it('should return failed with unknown code when error message does not match any pattern', async () => {
    readBrainConfigMock.mockReturnValue({ gitSync: true })
    existsSyncMock.mockReturnValue(true)
    ;(execa as unknown as Mock)
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git diff
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git add
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git commit
      .mockRejectedValueOnce(new Error('some unknown error'))

    const result = await syncBrain('/fake/brain')

    expect(result.status).toBe('failed')
    expect(result.error).toBeInstanceOf(GitSyncError)
    expect(result.error?.code).toBe('unknown')
  })
})
