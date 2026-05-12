import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  PathLike
} from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { initRepo, writeGitignore, syncBrain } from '@ai-brain/core/git'
import { GitSyncError } from '@ai-brain/core/errors'
import { createBrainWithConfig, cleanupBrain } from '../helpers'

describe('git integration', () => {
  let tmpHome: PathLike

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-git-test-'))
  })

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true })
  })

  describe('writeGitignore with real file system', () => {
    it('should write complete .gitignore file', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await writeGitignore({ brainPath: brainPath, commitCache: true })

      const gitignorePath = join(brainPath, '.gitignore')
      expect(existsSync(gitignorePath)).toBe(true)

      const content = readFileSync(gitignorePath, 'utf8')
      expect(content).toContain('.DS_Store')
      expect(content).toContain('node_modules/')
      expect(content).toContain('.venv/')
      expect(content).toContain('__pycache__/')
      expect(content).toContain('.obsidian/workspace.json')
    })

    it('should include cache directory when commitCache is false', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await writeGitignore({ brainPath: brainPath, commitCache: false })

      const content = readFileSync(join(brainPath, '.gitignore'), 'utf8')
      expect(content).toContain('graphify-out/cache/')
    })

    it('should exclude cache directory when commitCache is true', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await writeGitignore({ brainPath: brainPath, commitCache: true })

      const content = readFileSync(join(brainPath, '.gitignore'), 'utf8')
      expect(content).not.toContain('graphify-out/cache/')
    })
  })

  describe('initRepo with real git', () => {
    it('should initialize git repository', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({ brainPath: brainPath, remoteUrl: undefined })

      expect(existsSync(join(brainPath, '.git'))).toBe(true)

      const gitStatus = execSync('git status', { cwd: brainPath, encoding: 'utf8' })
      expect(gitStatus).toContain('On branch')
    })

    it('should add remote origin when URL provided', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({
        brainPath: brainPath,
        remoteUrl: 'https://github.com/test/repo.git'
      })

      const remotes = execSync('git remote -v', { cwd: brainPath, encoding: 'utf8' })
      expect(remotes).toContain('origin')
      expect(remotes).toContain('https://github.com/test/repo.git')
    })

    it('should not add remote when URL not provided', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({ brainPath: brainPath, remoteUrl: undefined })

      const remotes = execSync('git remote', { cwd: brainPath, encoding: 'utf8' })
      expect(remotes.trim()).toBe('')
    })
  })

  describe('full git workflow', () => {
    it('should init, add remote, commit, and push (simulated)', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({ brainPath: brainPath, remoteUrl: undefined })
      await writeGitignore({ brainPath: brainPath, commitCache: true })

      // Configure git user for CI environments
      execSync('git config user.email "test@test.com"', { cwd: brainPath, stdio: 'ignore' })
      execSync('git config user.name "Test User"', { cwd: brainPath, stdio: 'ignore' })

      writeFileSync(join(brainPath, 'test.md'), '# Test', 'utf8')

      execSync('git add .', { cwd: brainPath, stdio: 'ignore' })
      execSync('git commit -m "initial commit"', { cwd: brainPath, stdio: 'ignore' })

      const log = execSync('git log --oneline', { cwd: brainPath, encoding: 'utf8' })
      expect(log).toContain('initial commit')
    })

    it('should handle git operations in brain folder structure', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
      mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })

      await initRepo({ brainPath: brainPath, remoteUrl: undefined })
      await writeGitignore({ brainPath: brainPath, commitCache: true })

      // Configure git user for CI environments
      execSync('git config user.email "test@test.com"', { cwd: brainPath, stdio: 'ignore' })
      execSync('git config user.name "Test User"', { cwd: brainPath, stdio: 'ignore' })

      writeFileSync(join(brainPath, 'raw', 'notes', 'test.md'), '# Test Note', 'utf8')

      execSync('git add .', { cwd: brainPath, stdio: 'ignore' })
      execSync('git commit -m "add test note"', { cwd: brainPath, stdio: 'ignore' })

      const status = execSync('git status --porcelain', { cwd: brainPath, encoding: 'utf8' })
      expect(status.trim()).toBe('')
    })
  })

  describe('syncBrain integration', () => {
    it('should return skipped when gitSync is false', async () => {
      const brain = createBrainWithConfig('no-sync-brain', { gitSync: false })
      const result = await syncBrain(brain.brainPath)
      expect(result.status).toBe('skipped')
      cleanupBrain(brain)
    })

    it('should return skipped when .git dir does not exist', async () => {
      const brain = createBrainWithConfig('no-git-brain', { gitSync: true })
      const result = await syncBrain(brain.brainPath)
      expect(result.status).toBe('skipped')
      cleanupBrain(brain)
    })

    it('should return ok and push to local bare remote when gitSync=true', async () => {
      const brain = createBrainWithConfig('sync-brain', { gitSync: true })
      const remoteDir = join(brain.tmpHome, 'remote.git')
      mkdirSync(remoteDir, { recursive: true })
      execSync('git init --bare', { cwd: remoteDir, stdio: 'ignore' })
      execSync('git init', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync(`git remote add origin ${remoteDir}`, { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.email "test@test.com"', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.name "Test"', { cwd: brain.brainPath, stdio: 'ignore' })
      writeFileSync(join(brain.brainPath, 'note.md'), '# Hello', 'utf8')
      execSync('git add .', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git commit -m "initial"', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git push -u origin HEAD', { cwd: brain.brainPath, stdio: 'ignore' })
      writeFileSync(join(brain.brainPath, 'note2.md'), '# World', 'utf8')

      const result = await syncBrain(brain.brainPath)

      expect(result.status).toBe('ok')
      expect(result.error).toBeUndefined()
      const log = execSync('git log --oneline', { cwd: brain.brainPath, encoding: 'utf8' })
      expect(log.split('\n').filter(Boolean).length).toBe(2)
      cleanupBrain(brain)
    })

    it('should return failed when push fails (no remote configured)', async () => {
      const brain = createBrainWithConfig('no-remote-brain', { gitSync: true })
      execSync('git init', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.email "test@test.com"', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.name "Test"', { cwd: brain.brainPath, stdio: 'ignore' })
      writeFileSync(join(brain.brainPath, 'note.md'), '# Hello', 'utf8')
      execSync('git add .', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git commit -m "initial"', { cwd: brain.brainPath, stdio: 'ignore' })
      writeFileSync(join(brain.brainPath, 'note2.md'), '# World', 'utf8')

      const result = await syncBrain(brain.brainPath)

      expect(result.status).toBe('failed')
      expect(result.error).toBeInstanceOf(GitSyncError)
      // Could be 'push-failed' or 'no-remote' depending on git's exact message
      expect(result.error?.code).toBe('no-remote')
      cleanupBrain(brain)
    })

    it('should return failed with nothing-to-commit when nothing staged', async () => {
      const brain = createBrainWithConfig('no-changes-brain', { gitSync: true })
      execSync('git init', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.email "test@test.com"', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.name "Test"', { cwd: brain.brainPath, stdio: 'ignore' })
      writeFileSync(join(brain.brainPath, 'note.md'), '# Hello', 'utf8')
      execSync('git add .', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git commit -m "initial"', { cwd: brain.brainPath, stdio: 'ignore' })
      // No new files — nothing to commit

      const result = await syncBrain(brain.brainPath)

      expect(result.status).toBe('failed')
      expect(result.error).toBeInstanceOf(GitSyncError)
      expect(result.error?.code).toBe('nothing-to-commit')
      cleanupBrain(brain)
    })

    it('should produce commit message "Update AI brain" when diff has no file paths', async () => {
      // Set up a repo with gitSync=true, committed state, then add a file
      // that produces diff output with no lines containing '/'
      const brain = createBrainWithConfig('empty-diff-brain', { gitSync: true })
      const remoteDir = join(brain.tmpHome, 'remote.git')
      mkdirSync(remoteDir, { recursive: true })
      execSync('git init --bare', { cwd: remoteDir, stdio: 'ignore' })
      execSync('git init', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync(`git remote add origin ${remoteDir}`, { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.email "test@test.com"', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git config user.name "Test"', { cwd: brain.brainPath, stdio: 'ignore' })
      // Commit a file with no subdirectory (no '/' in the diff stat line)
      writeFileSync(join(brain.brainPath, 'readme'), 'initial', 'utf8')
      execSync('git add .', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git commit -m "initial"', { cwd: brain.brainPath, stdio: 'ignore' })
      execSync('git push -u origin HEAD', { cwd: brain.brainPath, stdio: 'ignore' })
      // Add another top-level file (no '/' in stat)
      writeFileSync(join(brain.brainPath, 'changelog'), 'v2', 'utf8')

      const result = await syncBrain(brain.brainPath)
      // Should succeed (ok) since we have a remote
      expect(result.status).toBe('ok')
      const log = execSync('git log --oneline', { cwd: brain.brainPath, encoding: 'utf8' })
      // The commit message falls back to 'Update AI brain' for files without '/'
      expect(log).toContain('Update AI brain')
      cleanupBrain(brain)
    })
  })
})
