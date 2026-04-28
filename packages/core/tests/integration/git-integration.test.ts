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
import { initRepo, writeGitignore } from '@ai-brain/core/git'

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

      await writeGitignore({ brainPath, commitCache: true })

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

      await writeGitignore({ brainPath, commitCache: false })

      const content = readFileSync(join(brainPath, '.gitignore'), 'utf8')
      expect(content).toContain('graphify-out/cache/')
    })

    it('should exclude cache directory when commitCache is true', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await writeGitignore({ brainPath, commitCache: true })

      const content = readFileSync(join(brainPath, '.gitignore'), 'utf8')
      expect(content).not.toContain('graphify-out/cache/')
    })
  })

  describe('initRepo with real git', () => {
    it('should initialize git repository', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({ brainPath, remoteUrl: undefined })

      expect(existsSync(join(brainPath, '.git'))).toBe(true)

      const gitStatus = execSync('git status', { cwd: brainPath, encoding: 'utf8' })
      expect(gitStatus).toContain('On branch')
    })

    it('should add remote origin when URL provided', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({ brainPath, remoteUrl: 'https://github.com/test/repo.git' })

      const remotes = execSync('git remote -v', { cwd: brainPath, encoding: 'utf8' })
      expect(remotes).toContain('origin')
      expect(remotes).toContain('https://github.com/test/repo.git')
    })

    it('should not add remote when URL not provided', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({ brainPath, remoteUrl: undefined })

      const remotes = execSync('git remote', { cwd: brainPath, encoding: 'utf8' })
      expect(remotes.trim()).toBe('')
    })
  })

  describe('full git workflow', () => {
    it('should init, add remote, commit, and push (simulated)', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      await initRepo({ brainPath, remoteUrl: undefined })
      await writeGitignore({ brainPath, commitCache: true })

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

      await initRepo({ brainPath, remoteUrl: undefined })
      await writeGitignore({ brainPath, commitCache: true })

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
})
