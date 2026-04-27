import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('execa', () => ({
  execa: vi.fn()
}))

describe('git', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    // Cleanup handled in each test
  })

  it('should create .gitignore with no cache line when commitCache is true', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    const { writeGitignore } = await import('../../src/git.ts')
    await writeGitignore({ brainPath: tmp, commitCache: true })
    const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
    expect(content.includes('.venv/')).toBe(true)
    expect(content.includes('graphify-out/.graphify_*')).toBe(true)
    expect(content.includes('graphify-out/cache/')).toBe(false)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should add graphify-out/cache/ to .gitignore when commitCache is false', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    const { writeGitignore } = await import('../../src/git.ts')
    await writeGitignore({ brainPath: tmp, commitCache: false })
    const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
    expect(content.includes('graphify-out/cache/')).toBe(true)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should add remote origin when remoteUrl is provided', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: '', stderr: '' })
    
    const { initRepo } = await import('../../src/git.ts')
    await initRepo({ brainPath: tmp, remoteUrl: 'https://github.com/user/repo.git' })
    
    expect(execa).toHaveBeenCalledWith('git', ['init'], { cwd: tmp })
    expect(execa).toHaveBeenCalledWith('git', ['remote', 'add', 'origin', 'https://github.com/user/repo.git'], { cwd: tmp })
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should init repo without remote when remoteUrl is not provided', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: '', stderr: '' })
    
    const { initRepo } = await import('../../src/git.ts')
    await initRepo({ brainPath: tmp, remoteUrl: undefined })
    
    expect(execa).toHaveBeenCalledWith('git', ['init'], { cwd: tmp })
    expect(execa).not.toHaveBeenCalledWith('git', expect.arrayContaining(['remote']), expect.anything())
    rmSync(tmp, { recursive: true, force: true })
  })
})