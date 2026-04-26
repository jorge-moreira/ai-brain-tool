import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((s) => s),
    dim: vi.fn((s) => s),
    red: vi.fn((s) => s),
    green: vi.fn((s) => s),
    cyan: vi.fn((s) => s)
  }
}))

vi.mock('execa', () => ({
  execa: vi.fn()
}))

describe('graphify', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return a path string or null for detectPython', async () => {
    const { detectPython } = await import('../../src/graphify.js')
    const result = await detectPython()
    expect(result === null || typeof result === 'string').toBe(true)
  })

  it('should return correct path for macOS/Linux venvPythonPath', async () => {
    const { venvPythonPath } = await import('../../src/graphify.js')
    expect(venvPythonPath('/tmp/brain')).toBe('/tmp/brain/.venv/bin/python3')
  })

  it('should throw when uv installed but not in PATH', async () => {
    const { execa } = await import('execa')
    const { ensureUv } = await import('../../src/graphify.js')
    
    execa
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockRejectedValueOnce(new Error('not found'))
    
    await expect(ensureUv()).rejects.toThrow('uv was installed but is not available in PATH')
  })

  it('should return false for venvExists with non-existent path', async () => {
    const { venvExists } = await import('../../src/graphify.js')
    expect(venvExists('/tmp/definitely-does-not-exist-brain')).toBe(false)
  })

  it('should return true for venvExists when python executable exists', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'venv-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const { venvExists } = await import('../../src/graphify.js')
    expect(venvExists(tmp)).toBe(true)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should detect python3 when available', async () => {
    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: 'Python 3.11.0', stderr: '' })
    const { detectPython } = await import('../../src/graphify.js')
    const result = await detectPython()
    expect(result).toBe('python3')
  })

  it('should fall back to python when python3 not available', async () => {
    const { execa } = await import('execa')
    execa.mockRejectedValueOnce(new Error('not found')).mockResolvedValue({ stdout: 'Python 3.10.0', stderr: '' })
    const { detectPython } = await import('../../src/graphify.js')
    const result = await detectPython()
    expect(result).toBe('python')
  })

  it('should return null when no python 3.10+ found', async () => {
    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('not found'))
    const { detectPython } = await import('../../src/graphify.js')
    const result = await detectPython()
    expect(result).toBe(null)
  })

  it('should reject python version below 3.10', async () => {
    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: 'Python 3.9.0', stderr: '' })
    const { detectPython } = await import('../../src/graphify.js')
    const result = await detectPython()
    expect(result).toBe(null)
  })

  it('should return uv when uv is available', async () => {
    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: 'uv 0.0.1', stderr: '' })
    const { detectPackageManager } = await import('../../src/graphify.js')
    const result = await detectPackageManager()
    expect(result).toBe('uv')
  })

  it('should return pip when uv not available', async () => {
    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('not found'))
    const { detectPackageManager } = await import('../../src/graphify.js')
    const result = await detectPackageManager()
    expect(result).toBe('pip')
  })

  it('should create venv with uv when uv is available and python exists', async () => {
    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: 'Python 3.11.0', stderr: '' })
    const tmp = mkdtempSync(join(tmpdir(), 'venv-uv-'))
    const { createVenv } = await import('../../src/graphify.js')
    await createVenv(tmp)
    expect(execa).toHaveBeenCalledWith('uv', expect.arrayContaining(['venv', '--python', 'python3', join(tmp, '.venv')]), expect.anything())
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should create venv with uv downloading python when not available', async () => {
    const { execa } = await import('execa')
    // ensureUv: uv not found, install, verify
    // detectPython: python3 not found, python not found
    // uv venv with python 3.10, uv pip install
    execa
      .mockRejectedValueOnce(new Error('not found')) // ensureUv: uv --version fails
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // ensureUv: install script
      .mockResolvedValueOnce({ stdout: 'uv 0.0.1', stderr: '' }) // ensureUv: verify
      .mockRejectedValueOnce(new Error('not found')) // detectPython: python3
      .mockRejectedValueOnce(new Error('not found')) // detectPython: python
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // uv venv
      .mockResolvedValue({ stdout: '', stderr: '' }) // uv pip install
    const tmp = mkdtempSync(join(tmpdir(), 'venv-uv-'))
    const { createVenv } = await import('../../src/graphify.js')
    await createVenv(tmp)
    expect(execa).toHaveBeenCalledWith('uv', expect.arrayContaining(['venv', '--python', '3.10', join(tmp, '.venv')]), expect.anything())
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should create venv after installing uv', async () => {
    const { execa } = await import('execa')
    // ensureUv checks: uv --version fails, then install succeeds, then verify succeeds
    execa
      .mockRejectedValueOnce(new Error('not found')) // uv not found initially
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // install script
      .mockResolvedValueOnce({ stdout: 'uv 0.0.1', stderr: '' }) // verify install
      // detectPython
      .mockResolvedValue({ stdout: 'Python 3.11.0', stderr: '' })
    const tmp = mkdtempSync(join(tmpdir(), 'venv-pip-'))
    const graphify = await import('../../src/graphify.js')
    await graphify.createVenv(tmp)
    // uv is always used after ensureUv
    expect(execa).toHaveBeenCalledWith('uv', expect.arrayContaining(['venv', '--python', 'python3', join(tmp, '.venv')]), expect.anything())
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should throw error when uv install fails', async () => {
    const { execa } = await import('execa')
    // ensureUv checks: uv --version fails, then install fails
    execa
      .mockRejectedValueOnce(new Error('not found')) // uv not found initially
      .mockRejectedValueOnce(new Error('network error')) // install script fails
    const tmp = mkdtempSync(join(tmpdir(), 'venv-no-py-'))
    const { createVenv } = await import('../../src/graphify.js')
    await expect(createVenv(tmp)).rejects.toThrow('Failed to install uv')
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should throw network error when ENOTFOUND', async () => {
    const { execa } = await import('execa')
    const { ensureUv } = await import('../../src/graphify.js')
    
    execa
      .mockRejectedValueOnce(new Error('not found')) // uv not found
      .mockRejectedValueOnce(new Error('ENOTFOUND')) // install fails with network error
    
    await expect(ensureUv()).rejects.toThrow('Cannot download uv')
  })

  it('should throw network error when ECONNRESET', async () => {
    const { execa } = await import('execa')
    const { ensureUv } = await import('../../src/graphify.js')
    
    execa
      .mockRejectedValueOnce(new Error('not found')) // uv not found
      .mockRejectedValueOnce(new Error('ECONNRESET')) // install fails with connection reset
    
    await expect(ensureUv()).rejects.toThrow('Cannot download uv')
  })

  it('should throw permission error when EACCES', async () => {
    const { execa } = await import('execa')
    const { ensureUv } = await import('../../src/graphify.js')
    
    execa
      .mockRejectedValueOnce(new Error('not found')) // uv not found
      .mockRejectedValueOnce(new Error('EACCES: permission denied')) // install fails with permission error
    
    await expect(ensureUv()).rejects.toThrow('Permission denied installing uv')
  })

  it('should throw permission error when permission denied', async () => {
    const { execa } = await import('execa')
    const { ensureUv } = await import('../../src/graphify.js')
    
    execa
      .mockRejectedValueOnce(new Error('not found')) // uv not found
      .mockRejectedValueOnce(new Error('permission denied')) // install fails with permission error
    
    await expect(ensureUv()).rejects.toThrow('Permission denied installing uv')
  })

  it('should throw generic error when install fails with other error', async () => {
    const { execa } = await import('execa')
    const { ensureUv } = await import('../../src/graphify.js')
    
    execa
      .mockRejectedValueOnce(new Error('not found')) // uv not found
      .mockRejectedValueOnce(new Error('some other error')) // install fails with generic error
    
    await expect(ensureUv()).rejects.toThrow('Failed to install uv')
  })

  it('should upgrade venv with uv', async () => {
    const { execa } = await import('execa')
    // ensureUv: uv found
    execa.mockResolvedValue({ stdout: 'uv 0.0.1', stderr: '' })
    const tmp = mkdtempSync(join(tmpdir(), 'upgrade-uv-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const { upgradeVenv } = await import('../../src/graphify.js')
    await upgradeVenv(tmp)
    expect(execa).toHaveBeenCalledWith('uv', expect.arrayContaining(['pip', 'install', '--upgrade']), expect.anything())
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should run graphify update successfully', async () => {
    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: '', stderr: '' })
    const tmp = mkdtempSync(join(tmpdir(), 'graphify-run-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const { runGraphify } = await import('../../src/graphify.js')
    await runGraphify(tmp)
    expect(execa).toHaveBeenCalledWith(expect.stringContaining('python3'), expect.arrayContaining(['-m', 'graphify', 'update', 'raw']), expect.anything())
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should handle "No code files found" error gracefully', async () => {
    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('No code files found'))
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const tmp = mkdtempSync(join(tmpdir(), 'graphify-nocode-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const graphify = await import('../../src/graphify.js')
    await graphify.runGraphify(tmp)
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String))
    consoleLogSpy.mockRestore()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should handle "Nothing to update" error gracefully', async () => {
    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('Nothing to update'))
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const tmp = mkdtempSync(join(tmpdir(), 'graphify-noupdate-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const graphify = await import('../../src/graphify.js')
    await graphify.runGraphify(tmp)
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String))
    consoleLogSpy.mockRestore()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should handle "No files found" error gracefully', async () => {
    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('No files found'))
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const tmp = mkdtempSync(join(tmpdir(), 'graphify-nofiles-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const graphify = await import('../../src/graphify.js')
    await graphify.runGraphify(tmp)
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String))
    consoleLogSpy.mockRestore()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should re-throw other errors from runGraphify', async () => {
    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('Some other error'))
    const tmp = mkdtempSync(join(tmpdir(), 'graphify-error-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const { runGraphify } = await import('../../src/graphify.js')
    await expect(runGraphify(tmp)).rejects.toThrow('Some other error')
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should build pkg with mcp extra only', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'buildpkg-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const { createVenv } = await import('../../src/graphify.js')
    await createVenv(tmp, ['mcp'])
    const { execa } = await import('execa')
    const installCall = execa.mock.calls.find(c => c[1]?.includes('install'))
    expect(installCall[1]).toContainEqual(expect.stringContaining('graphifyy[mcp]'))
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should build pkg with multiple extras', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'buildpkg-multi-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
    const { createVenv } = await import('../../src/graphify.js')
    await createVenv(tmp, ['mcp', 'extra1', 'extra2'])
    const { execa } = await import('execa')
    const installCall = execa.mock.calls.find(c => c[1]?.includes('install'))
    expect(installCall[1]).toContainEqual(expect.stringContaining('graphifyy[mcp,extra1,extra2]'))
    rmSync(tmp, { recursive: true, force: true })
  })

})