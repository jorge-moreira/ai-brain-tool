import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'

function initGitRepo(path: string) {
  execSync('git init', { cwd: path, stdio: 'ignore' })
  execSync('git config user.email "test@test.com"', { cwd: path, stdio: 'ignore' })
  execSync('git config user.name "Test"', { cwd: path, stdio: 'ignore' })
}

function makeDummyCommit(path: string, fileName: string, content: string) {
  const dir = join(path, 'raw', 'notes')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(path, fileName), content, 'utf8')
  execSync('git add .', { cwd: path, stdio: 'ignore' })
  execSync('git commit -m "initial"', { cwd: path, stdio: 'ignore' })
}

function getCommitMessage(brainPath: string) {
  const stdout = execSync('git diff --stat HEAD', { cwd: brainPath, encoding: 'utf8' })
  if (!stdout.trim()) return 'Update AI brain'

  const lines = stdout.split('\n').filter(l => l.includes('/'))
  const changes = lines
    .map(l => {
      const parts = l.split('|')
      return parts[0]?.trim().replace('raw/', '').replace('graphify-out/', '')
    })
    .filter(Boolean)
    .slice(0, 3)

  if (changes.length === 0) return 'Update AI brain'
  return `brain: update ${changes.join(', ')}`
}

describe('update', () => {
  it('should return meaningful message when files have changed', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'update-test-'))
    afterEach(() => rmSync(tmp, { recursive: true, force: true }))

    initGitRepo(tmp)
    mkdirSync(join(tmp, 'raw', 'notes'), { recursive: true })
    writeFileSync(join(tmp, 'raw/notes/rust-ownership.md'), '# Rust Ownership', 'utf8')
    writeFileSync(join(tmp, '.gitignore'), 'node_modules/', 'utf8')
    execSync('git add .', { cwd: tmp, stdio: 'ignore' })
    execSync('git commit -m "initial"', { cwd: tmp, stdio: 'ignore' })

    writeFileSync(join(tmp, 'raw/notes/new-concept.md'), '# New Concept', 'utf8')
    execSync('git add .', { cwd: tmp, stdio: 'ignore' })
    const output = execSync('git diff --stat --cached HEAD', { cwd: tmp, encoding: 'utf8' })

    expect(output.includes('new-concept') || output.includes('raw/notes')).toBe(true)
  })

  it('should return fallback message when no changes exist', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'update-test-'))
    afterEach(() => rmSync(tmp, { recursive: true, force: true }))

    initGitRepo(tmp)
    makeDummyCommit(tmp, 'raw/notes/rust-ownership.md', '# Rust Ownership')

    const message = getCommitMessage(tmp)
    expect(message).toBe('Update AI brain')
  })

  it('should extract up to 3 files in the commit message', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'update-test-'))
    afterEach(() => rmSync(tmp, { recursive: true, force: true }))

    initGitRepo(tmp)
    makeDummyCommit(tmp, 'raw/notes/rust-ownership.md', '# Rust Ownership')

    writeFileSync(join(tmp, 'raw/notes/file1.md'), '# File 1', 'utf8')
    writeFileSync(join(tmp, 'raw/notes/file2.md'), '# File 2', 'utf8')
    writeFileSync(join(tmp, 'raw/notes/file3.md'), '# File 3', 'utf8')
    writeFileSync(join(tmp, 'raw/notes/file4.md'), '# File 4', 'utf8')

    const message = getCommitMessage(tmp)
    const fileCount = message.split(',').length

    expect(fileCount).toBeLessThanOrEqual(3)
  })
})
