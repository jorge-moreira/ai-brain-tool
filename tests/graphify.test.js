import { describe, it, expect, after } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('graphify', () => {
  it('should return a path string or null for detectPython', async () => {
    const { detectPython } = await import('../src/graphify.js')
    const result = await detectPython()
    expect(result === null || typeof result === 'string').toBe(true)
  })

  it('should return correct path for macOS/Linux venvPythonPath', async () => {
    const { venvPythonPath } = await import('../src/graphify.js')
    expect(venvPythonPath('/tmp/brain')).toBe('/tmp/brain/.venv/bin/python3')
  })

  it('should return false for venvExists with non-existent path', async () => {
    const { venvExists } = await import('../src/graphify.js')
    expect(venvExists('/tmp/definitely-does-not-exist-brain')).toBe(false)
  })

  it('should return true after venv creation', async () => {
    const { detectPython, venvExists, createVenv } = await import('../src/graphify.js')
    const python = await detectPython()
    if (!python) {
      return
    }

    const tmp = mkdtempSync(join(tmpdir(), 'venv-test-'))
    after(() => rmSync(tmp, { recursive: true, force: true }))

    await createVenv(tmp)
    expect(venvExists(tmp)).toBe(true)
  })
})