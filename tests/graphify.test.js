import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { detectPython, venvPythonPath, venvExists } = await import('../src/graphify.js')

test('detectPython returns a path string or null', async () => {
  const result = await detectPython()
  // On any dev machine, Python should exist
  assert.ok(result === null || typeof result === 'string')
})

test('venvPythonPath returns correct path for macOS/Linux', () => {
  const result = venvPythonPath('/tmp/brain')
  assert.equal(result, '/tmp/brain/.venv/bin/python3')
})

test('venvExists returns false for non-existent path', () => {
  const result = venvExists('/tmp/definitely-does-not-exist-brain')
  assert.equal(result, false)
})

test('venvExists returns true after venv creation', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'venv-test-'))
  const { createVenv } = await import('../src/graphify.js')

  after(() => {
    rmSync(tmp, { recursive: true, force: true })
  })

  await createVenv(tmp)
  assert.ok(venvExists(tmp))
})
