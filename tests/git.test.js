import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { initRepo, writeGitignore } = await import('../src/git.js')

test('writeGitignore creates .gitignore with commitCache=true (no cache line)', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
  await writeGitignore({ brainPath: tmp, commitCache: true })
  const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
  assert.ok(content.includes('.venv/'))
  assert.ok(content.includes('graphify-out/.graphify_*'))
  assert.ok(!content.includes('graphify-out/cache/'))
  rmSync(tmp, { recursive: true, force: true })
})

test('writeGitignore adds graphify-out/cache/ when commitCache=false', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
  await writeGitignore({ brainPath: tmp, commitCache: false })
  const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
  assert.ok(content.includes('graphify-out/cache/'))
  rmSync(tmp, { recursive: true, force: true })
})

test('initRepo creates a .git directory', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
  await initRepo({ brainPath: tmp, remoteUrl: null })
  assert.ok(existsSync(join(tmp, '.git')))
  rmSync(tmp, { recursive: true, force: true })
})
