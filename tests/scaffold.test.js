import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { createBrainFolder } = await import('../src/scaffold.js')

test('createBrainFolder creates expected directory structure', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  after(() => rmSync(tmp, { recursive: true, force: true }))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: false })

  assert.ok(existsSync(join(brainPath, 'raw', 'notes')))
  assert.ok(existsSync(join(brainPath, 'raw', 'articles')))
  assert.ok(existsSync(join(brainPath, 'raw', 'projects')))
  assert.ok(existsSync(join(brainPath, 'raw', 'documentation')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom')))
  assert.ok(existsSync(join(brainPath, 'graphify-out')))
  assert.ok(existsSync(join(brainPath, 'AGENTS.md')))
  assert.ok(existsSync(join(brainPath, '.graphifyignore')))
})

test('createBrainFolder copies bundled markdown templates to _bundled/', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  after(() => rmSync(tmp, { recursive: true, force: true }))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: false })

  const bundled = readdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'))
  assert.ok(bundled.includes('book-template.md'))
  assert.ok(bundled.includes('meeting-template.md'))
})

test('createBrainFolder creates .obsidian/ when includeObsidian is true', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  after(() => rmSync(tmp, { recursive: true, force: true }))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: true })

  assert.ok(existsSync(join(brainPath, '.obsidian', 'templates.json')))
  assert.ok(existsSync(join(brainPath, '.obsidian', 'app.json')))
})

test('createBrainFolder does not create .obsidian/ when includeObsidian is false', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  after(() => rmSync(tmp, { recursive: true, force: true }))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: false })

  assert.ok(!existsSync(join(brainPath, '.obsidian')))
})
