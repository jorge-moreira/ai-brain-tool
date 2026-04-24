import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('git', () => {
  afterEach(() => {
    // Cleanup handled in each test
  })

  it('should create .gitignore with no cache line when commitCache is true', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    const { writeGitignore } = await import('../src/git.js')
    await writeGitignore({ brainPath: tmp, commitCache: true })
    const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
    expect(content.includes('.venv/')).toBe(true)
    expect(content.includes('graphify-out/.graphify_*')).toBe(true)
    expect(content.includes('graphify-out/cache/')).toBe(false)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should add graphify-out/cache/ to .gitignore when commitCache is false', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    const { writeGitignore } = await import('../src/git.js')
    await writeGitignore({ brainPath: tmp, commitCache: false })
    const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
    expect(content.includes('graphify-out/cache/')).toBe(true)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should create a .git directory when initRepo is called', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
    const { initRepo } = await import('../src/git.js')
    await initRepo({ brainPath: tmp, remoteUrl: null })
    expect(existsSync(join(tmp, '.git'))).toBe(true)
    rmSync(tmp, { recursive: true, force: true })
  })
})