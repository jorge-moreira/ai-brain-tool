import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execa } from 'execa'
import {
  detectPython,
  venvPythonPath,
  ensureUv,
  venvExists,
  detectPackageManager,
  createVenv,
  runGraphify,
  upgradeVenv
} from '@ai-brain/core/graphify'

vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    red: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    cyan: vi.fn((s: string) => s)
  }
}))

vi.mock('execa', () => ({
  execa: vi.fn()
}))

vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn(),
    fail: vi.fn()
  })
}))

const mockedExeca = execa as unknown as Mock<
  (
    command: string,
    args?: readonly string[],
    options?: unknown
  ) => Promise<{ stdout: string; stderr: string }>
>

describe('graphify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedExeca.mockReset()
  })

  describe('venvPythonPath', () => {
    it('should return correct path for macOS/Linux venvPythonPath', () => {
      expect(venvPythonPath('/tmp/brain')).toBe('/tmp/brain/.venv/bin/python3')
    })
  })

  describe('venvExists', () => {
    it('should return false for venvExists with non-existent path', () => {
      expect(venvExists('/tmp/definitely-does-not-exist-brain')).toBe(false)
    })

    it('should return true for venvExists when python executable exists', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'venv-test-'))
      mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
      expect(venvExists(tmp)).toBe(true)
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  describe('detectPython', () => {
    it('should return a path string or null for detectPython', async () => {
      const result = await detectPython()
      expect(result === null || typeof result === 'string').toBe(true)
    })

    it('should detect python3 when available', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: 'Python 3.11.0', stderr: '' }))
      const result = await detectPython()
      expect(result).toBe('python3')
    })

    it('should use stderr when stdout is empty', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: '', stderr: 'Python 3.12.0' }))
      const result = await detectPython()
      expect(result).toBe('python3')
    })

    it('should return null when python3 not available', async () => {
      mockedExeca.mockImplementation(() => Promise.reject(new Error('not found')))
      const result = await detectPython()
      expect(result).toBeNull()
    })
  })

  describe('detectPackageManager', () => {
    it('should detect uv when available', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: 'uv 0.5.0', stderr: '' }))
      const result = await detectPackageManager()
      expect(result).toBe('uv')
    })

    it('should detect pip when uv not available', async () => {
      mockedExeca
        .mockImplementationOnce(() => Promise.reject(new Error('not found')))
        .mockImplementationOnce(() => Promise.resolve({ stdout: 'pip 23.0', stderr: '' }))
      const result = await detectPackageManager()
      expect(result).toBe('pip')
    })

    it('should return pip as fallback when uv throws', async () => {
      mockedExeca.mockImplementation(() => {
        throw new Error('not found')
      })
      const result = await detectPackageManager()
      expect(result).toBe('pip')
    })

    it('should return uv when uv is available', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: 'uv 0.5.0', stderr: '' }))
      const result = await detectPackageManager()
      expect(result).toBe('uv')
    })

    it('should return pip when uv is not available', async () => {
      mockedExeca.mockImplementation(() => {
        throw new Error('not found')
      })
      const result = await detectPackageManager()
      expect(result).toBe('pip')
    })
  })

  describe('ensureUv', () => {
    it('should throw when uv installed but not in PATH', async () => {
      mockedExeca
        .mockImplementationOnce(() => Promise.reject(new Error('not found')))
        .mockImplementationOnce(() => Promise.resolve({ stdout: '', stderr: '' }))
        .mockImplementationOnce(() => Promise.reject(new Error('not found')))

      await expect(ensureUv()).rejects.toThrow('uv was installed but is not available in PATH')
    })

    it('should throw when uv install fails with network error', async () => {
      mockedExeca
        .mockImplementationOnce(() => Promise.reject(new Error('not found')))
        .mockImplementationOnce(() => Promise.reject(new Error('ENOTFOUND')))
      await expect(ensureUv()).rejects.toThrow('Cannot download uv')
    })

    it('should throw when uv install fails with permission error', async () => {
      mockedExeca
        .mockImplementationOnce(() => Promise.reject(new Error('not found')))
        .mockImplementationOnce(() => Promise.reject(new Error('EACCES')))
      await expect(ensureUv()).rejects.toThrow('Permission denied')
    })

    it('should throw when uv install fails with generic error', async () => {
      mockedExeca
        .mockImplementationOnce(() => Promise.reject(new Error('not found')))
        .mockImplementationOnce(() => Promise.reject(new Error('Some error')))
      await expect(ensureUv()).rejects.toThrow('Failed to install uv')
    })
  })

  describe('createVenv', () => {
    it('should build pkg with mcp extra only', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: 'uv 0.5.0', stderr: '' }))
      const tmp = mkdtempSync(join(tmpdir(), 'buildpkg-'))
      mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
      await createVenv(tmp, ['mcp'])
      const installCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('install')
      })
      expect(installCall?.[1]).toEqual(
        expect.arrayContaining([expect.stringContaining('graphifyy[mcp]')])
      )
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should build pkg with multiple extras', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: 'uv 0.5.0', stderr: '' }))
      const tmp = mkdtempSync(join(tmpdir(), 'buildpkg-multi-'))
      mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
      await createVenv(tmp, ['mcp', 'extra1', 'extra2'])
      const installCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('install')
      })
      expect(installCall?.[1]).toEqual(
        expect.arrayContaining([expect.stringContaining('graphifyy[mcp,extra1,extra2]')])
      )
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  describe('upgradeVenv', () => {
    it('should upgrade venv with mcp extra only', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: 'uv 0.5.0', stderr: '' }))
      const tmp = mkdtempSync(join(tmpdir(), 'upgrade-'))
      mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
      await upgradeVenv(tmp, ['mcp'])
      const upgradeCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('--upgrade')
      })
      expect(upgradeCall).toBeDefined()
      expect(upgradeCall?.[1]).toEqual(
        expect.arrayContaining([expect.stringContaining('graphifyy[mcp]')])
      )
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should upgrade venv with multiple extras', async () => {
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: 'uv 0.5.0', stderr: '' }))
      const tmp = mkdtempSync(join(tmpdir(), 'upgrade-multi-'))
      mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
      await upgradeVenv(tmp, ['mcp', 'office', 'video'])
      const upgradeCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('--upgrade')
      })
      expect(upgradeCall).toBeDefined()
      expect(upgradeCall?.[1]).toEqual(
        expect.arrayContaining([expect.stringContaining('graphifyy[mcp,office,video]')])
      )
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  describe('runGraphify', () => {
    it('should return success:true, noFilesFound:true when no code files found', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'graphify-nocode-'))
      const error = new Error('No code files found') as Error & { shortMessage?: string }
      error.shortMessage = 'graphify update failed'
      mockedExeca.mockRejectedValue(error)
      const result = await runGraphify(tmp)
      expect(result.success).toBe(true)
      expect(result.noFilesFound).toBe(true)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should return success:true when graphify runs successfully', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'graphify-success-'))
      mkdirSync(join(tmp, 'raw'), { recursive: true })
      writeFileSync(join(tmp, 'raw', 'test.txt'), 'test')
      mockedExeca.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '' }))
      const result = await runGraphify(tmp)
      expect(result.success).toBe(true)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should throw when graphify fails with real error', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'graphify-fail-'))
      mkdirSync(join(tmp, 'raw'), { recursive: true })
      writeFileSync(join(tmp, 'raw', 'test.txt'), 'test')
      mockedExeca.mockImplementation(() => Promise.reject(new Error('graphify failed')))
      await expect(runGraphify(tmp)).rejects.toThrow('graphify failed')
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should re-throw other errors from runGraphify', async () => {
      mockedExeca.mockImplementation(() => Promise.reject(new Error('Some other error')))
      const tmp = mkdtempSync(join(tmpdir(), 'graphify-error-'))
      mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(tmp, '.venv', 'bin', 'python3'), '')
      await expect(runGraphify(tmp)).rejects.toThrow('Some other error')
      rmSync(tmp, { recursive: true, force: true })
    })
  })
})
