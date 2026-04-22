import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Override HOME for isolation
const tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-test-'))
process.env.HOME = tmpHome

const { readConfig, writeConfig, configPath } = await import('../src/config.js')

after(() => rmSync(tmpHome, { recursive: true, force: true }))

test('configPath() is inside HOME', () => {
  assert.ok(configPath().startsWith(tmpHome))
})

test('readConfig returns null when no config file exists', () => {
  const result = readConfig()
  assert.equal(result, null)
})

test('writeConfig creates config file with brainPath', () => {
  writeConfig({ brainPath: '/tmp/my-brain' })
  assert.ok(existsSync(configPath()))
})

test('readConfig returns brainPath after write', () => {
  writeConfig({ brainPath: '/tmp/my-brain' })
  const result = readConfig()
  assert.equal(result.brainPath, '/tmp/my-brain')
})
