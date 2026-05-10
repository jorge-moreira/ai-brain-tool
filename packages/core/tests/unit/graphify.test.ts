import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execa } from 'execa'

vi.mock('fs', async importOriginal => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, existsSync: vi.fn(actual.existsSync) }
})
import {
  detectPython,
  venvPythonPath,
  ensureUv,
  venvExists,
  detectPackageManager,
  createVenv,
  runGraphify,
  upgradeVenv,
  GLOBAL_VENV_PATH,
  globalVenvPythonPath,
  globalVenvExists,
  createGlobalVenv,
  upgradeGlobalVenv,
  getBrainSize,
  countNotes,
  clearGraphifyCache,
  getBrainSizeById,
  countNotesById,
  clearGraphifyCacheById
} from '@ai-brain/core/graphify'

vi.mock('@ai-brain/core/config/brains', () => ({
  resolveBrain: vi.fn().mockReturnValue({ id: 'work', path: '/tmp/brain', isLocal: true })
}))

import { resolveBrain } from '@ai-brain/core/config/brains'

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

  describe('ensureUv PATH update', () => {
    const originalHome = process.env.HOME
    const originalPath = process.env.PATH

    afterEach(() => {
      process.env.HOME = originalHome
      process.env.PATH = originalPath
    })

    it('should add uv bin dir to PATH after installing uv', async () => {
      process.env.PATH = '/usr/bin:/bin'
      mockedExeca
        .mockImplementationOnce(() => Promise.reject(new Error('not found')))
        .mockImplementationOnce(() => Promise.resolve({ stdout: '', stderr: '' }))
        .mockImplementationOnce(() => Promise.resolve({ stdout: 'uv 1.0.0', stderr: '' }))

      await ensureUv()
      expect(process.env.PATH).toContain('.local/bin')
    })

    it('should skip PATH update when uv is already installed', async () => {
      const savedPath = process.env.PATH
      mockedExeca.mockResolvedValueOnce({ stdout: 'uv 1.0.0', stderr: '' })

      await ensureUv()
      expect(process.env.PATH).toBe(savedPath)
    })
  })

  describe('createVenv with detected python', () => {
    it('should use detected python when available', async () => {
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'Python 3.11.0', stderr: '' })

      const tmp = mkdtempSync(join(tmpdir(), 'createVenv-detected-'))

      await createVenv(tmp, [])

      const venvCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('venv')
      })
      expect(venvCall?.[1]).toEqual(expect.arrayContaining(['--python', 'python3']))
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should use python 3.10 fallback when no python detected', async () => {
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' })
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })

      const tmp = mkdtempSync(join(tmpdir(), 'createVenv-fallback-'))

      await createVenv(tmp, [])

      const venvCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('venv')
      })
      expect(venvCall?.[1]).toEqual(expect.arrayContaining(['--python', '3.10']))
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  describe('createGlobalVenv with detected python', () => {
    it('should use detected python when available', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false)
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'Python 3.12.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })

      await createGlobalVenv([])

      const venvCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('venv')
      })
      expect(venvCall?.[1]).toEqual(expect.arrayContaining(['--python', 'python3']))
    })

    it('should use python 3.10 fallback when no python detected', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false)
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' })
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })

      await createGlobalVenv([])

      const venvCall = mockedExeca.mock.calls.find(c => {
        const args = c[1] as unknown as string[] | undefined
        return args?.includes('venv')
      })
      expect(venvCall?.[1]).toEqual(expect.arrayContaining(['--python', '3.10']))
    })
  })

  describe('getBrainSize', () => {
    it('should return 0 for an empty directory', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-size-empty-'))
      expect(getBrainSize(tmp)).toBe(0)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should return correct size for a directory with files', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-size-'))
      writeFileSync(join(tmp, 'note.md'), 'hello') // 5 bytes
      expect(getBrainSize(tmp)).toBe(5)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should return correct size for nested directories', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-size-nested-'))
      mkdirSync(join(tmp, 'sub'), { recursive: true })
      writeFileSync(join(tmp, 'a.md'), '12345') // 5 bytes
      writeFileSync(join(tmp, 'sub', 'b.md'), '123') // 3 bytes
      expect(getBrainSize(tmp)).toBe(8)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should return 0 for a non-existent path', () => {
      expect(getBrainSize('/tmp/definitely-does-not-exist-brain-size')).toBe(0)
    })
  })

  describe('countNotes', () => {
    it('should return 0 for an empty directory', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'count-notes-empty-'))
      expect(countNotes(tmp)).toBe(0)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should count only markdown files', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'count-notes-'))
      writeFileSync(join(tmp, 'note.md'), '')
      writeFileSync(join(tmp, 'note2.md'), '')
      writeFileSync(join(tmp, 'other.txt'), '')
      expect(countNotes(tmp)).toBe(2)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should count markdown files in nested directories', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'count-notes-nested-'))
      mkdirSync(join(tmp, 'sub'), { recursive: true })
      writeFileSync(join(tmp, 'a.md'), '')
      writeFileSync(join(tmp, 'sub', 'b.md'), '')
      writeFileSync(join(tmp, 'sub', 'c.txt'), '')
      expect(countNotes(tmp)).toBe(2)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should skip .obsidian directory', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'count-notes-obsidian-'))
      mkdirSync(join(tmp, '.obsidian'), { recursive: true })
      writeFileSync(join(tmp, 'note.md'), '')
      writeFileSync(join(tmp, '.obsidian', 'hidden.md'), '')
      expect(countNotes(tmp)).toBe(1)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should skip node_modules directory', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'count-notes-nodemodules-'))
      mkdirSync(join(tmp, 'node_modules'), { recursive: true })
      writeFileSync(join(tmp, 'note.md'), '')
      writeFileSync(join(tmp, 'node_modules', 'pkg.md'), '')
      expect(countNotes(tmp)).toBe(1)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should return 0 for a non-existent path', () => {
      expect(countNotes('/tmp/definitely-does-not-exist-count-notes')).toBe(0)
    })
  })

  describe('clearGraphifyCache', () => {
    it('should remove graphify-out directory if it exists', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'clear-cache-'))
      mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
      writeFileSync(join(tmp, 'graphify-out', 'output.json'), '{}')
      clearGraphifyCache(tmp)
      expect(existsSync(join(tmp, 'graphify-out'))).toBe(false)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should not throw if graphify-out does not exist', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'clear-cache-missing-'))
      expect(() => clearGraphifyCache(tmp)).not.toThrow()
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  describe('global venv', () => {
    it('should return correct global venv path', () => {
      expect(GLOBAL_VENV_PATH).toContain('.ai-brain-tool')
      expect(GLOBAL_VENV_PATH).toContain('.venv')
    })

    it('should return correct global venv Python path', () => {
      const expected = globalVenvPythonPath()
      expect(expected).toContain('.ai-brain-tool')
      expect(expected).toContain('.venv')
    })

    it('should check if global venv exists', () => {
      const result = globalVenvExists()
      expect(typeof result).toBe('boolean')
    })

    it('should create global venv', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false)
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
      await createGlobalVenv(['mcp'])
      expect(mockedExeca).toHaveBeenCalledWith(
        'uv',
        expect.arrayContaining(['venv']),
        expect.anything()
      )
    })

    it('should upgrade global venv', async () => {
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
      await upgradeGlobalVenv(['mcp'])
      expect(mockedExeca).toHaveBeenCalledWith(
        'uv',
        expect.arrayContaining(['pip', 'install', '--upgrade']),
        expect.anything()
      )
    })
  })

  describe('getBrainSizeById', () => {
    it('should resolve the brain and return its size', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-size-by-id-'))
      writeFileSync(join(tmp, 'note.md'), 'hello') // 5 bytes
      ;(resolveBrain as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'work',
        path: tmp,
        isLocal: true
      })
      const size = getBrainSizeById('work')
      expect(size).toBe(5)
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  describe('countNotesById', () => {
    it('should resolve the brain and count notes', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'count-notes-by-id-'))
      writeFileSync(join(tmp, 'a.md'), '')
      writeFileSync(join(tmp, 'b.md'), '')
      ;(resolveBrain as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'work',
        path: tmp,
        isLocal: true
      })
      const count = countNotesById('work')
      expect(count).toBe(2)
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  describe('createVenv exitCode 101 handling', () => {
    it('should swallow exitCode 101 error when pip target exists after install', async () => {
      let existsCallCount = 0
      vi.mocked(existsSync).mockImplementation(() => {
        existsCallCount++
        // first call: guard check (pipTarget not yet created) → false → proceed to create venv
        // second call: inside catch after 101 → pipTarget now exists → true → swallow
        return existsCallCount >= 2
      })
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' }) // ensureUv
        .mockResolvedValueOnce({ stdout: 'Python 3.12.0', stderr: '' }) // detectPython
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // uv venv
        .mockRejectedValueOnce(Object.assign(new Error('tokio panic'), { exitCode: 101 })) // pip install

      await expect(createVenv('/tmp/brain', [])).resolves.toBeUndefined()
    })

    it('should rethrow exitCode 101 error when pip target does not exist after install', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' }) // ensureUv
        .mockResolvedValueOnce({ stdout: 'Python 3.12.0', stderr: '' }) // detectPython
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // uv venv
        .mockRejectedValueOnce(Object.assign(new Error('tokio panic'), { exitCode: 101 })) // pip install

      await expect(createVenv('/tmp/brain', [])).rejects.toThrow('tokio panic')
    })

    it('should rethrow non-101 errors from pip install', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      mockedExeca
        .mockResolvedValueOnce({ stdout: 'uv 0.5.0', stderr: '' }) // ensureUv
        .mockResolvedValueOnce({ stdout: 'Python 3.12.0', stderr: '' }) // detectPython
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // uv venv
        .mockRejectedValueOnce(Object.assign(new Error('install failed'), { exitCode: 1 })) // pip install

      await expect(createVenv('/tmp/brain', [])).rejects.toThrow('install failed')
    })
  })

  describe('getBrainSize edge cases', () => {
    it('should return 0 for a path that is neither file nor directory', () => {
      // /dev/stdin is a character device — statSync succeeds but isFile/isDirectory are both false
      expect(getBrainSize('/dev/stdin')).toBe(0)
    })
  })

  describe('countNotes edge cases', () => {
    it('should return 0 for a path that is neither file nor directory', () => {
      expect(countNotes('/dev/stdin')).toBe(0)
    })
  })

  describe('clearGraphifyCacheById', () => {
    it('should resolve the brain and clear its cache', () => {
      const tmp = mkdtempSync(join(tmpdir(), 'clear-cache-by-id-'))
      mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
      writeFileSync(join(tmp, 'graphify-out', 'output.json'), '{}')
      ;(resolveBrain as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'work',
        path: tmp,
        isLocal: true
      })
      clearGraphifyCacheById('work')
      expect(existsSync(join(tmp, 'graphify-out'))).toBe(false)
      rmSync(tmp, { recursive: true, force: true })
    })
  })
})
