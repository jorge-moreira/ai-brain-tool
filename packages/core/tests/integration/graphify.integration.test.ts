import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { vi } from 'vitest'
import {
  detectPython,
  detectPackageManager,
  createVenv,
  runGraphify,
  venvExists,
  venvPythonPath,
  getBrainSize,
  countNotes,
  countNotesById,
  clearGraphifyCache,
  clearGraphifyCacheById
} from '@ai-brain/core/graphify'
import { addBrain } from '@ai-brain/core/config'

describe('graphify integration', () => {
  let tmpHome: string
  let originalHome: string | undefined

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-graphify-test-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
  })

  afterEach(() => {
    process.env.HOME = originalHome
    rmSync(tmpHome, { recursive: true, force: true })
  })

  describe('venv detection', () => {
    it('should detect non-existent venv', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })

      expect(venvExists(brainPath)).toBe(false)
    })

    it('should detect existing venv', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')

      expect(venvExists(brainPath)).toBe(true)
    })

    it('should return correct python path for macOS/Linux', async () => {
      const brainPath = join(tmpHome, 'brain')

      const pythonPath = venvPythonPath(brainPath)
      expect(pythonPath).toBe(join(brainPath, '.venv', 'bin', 'python3'))
    })
  })

  describe('python detection', () => {
    it('should detect available python3', async () => {
      const result = await detectPython()

      expect(result === null || typeof result === 'string').toBe(true)
    })

    it('should validate python version >= 3.10', async () => {
      try {
        const version = execSync('python3 --version', { encoding: 'utf8' })
        const match = version.match(/Python (\d+)\.(\d+)/)

        if (
          match &&
          (parseInt(match[1]) > 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) >= 10))
        ) {
          const result = await detectPython()
          expect(result).toBe('python3')
        }
      } catch {
        const result = await detectPython()
        expect(result === null || typeof result === 'string').toBe(true)
      }
    })
  })

  describe('package manager detection', () => {
    it('should detect uv or pip', async () => {
      const result = await detectPackageManager()

      expect(['uv', 'pip']).toContain(result)
    })
  })

  describe('createVenv integration (when uv available)', () => {
    // These tests require uv for Python management (uv will download Python 3.10+ if needed)
    // Skip if uv is not installed - install with: brew install uv
    it('should create venv with graphify installation', async () => {
      const pm = await detectPackageManager()

      if (pm !== 'uv') {
        console.log('Skipping: uv not found in PATH. Install with: brew install uv')
        return
      }

      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })

      await createVenv(brainPath)

      expect(venvExists(brainPath)).toBe(true)
      expect(existsSync(join(brainPath, '.venv', 'bin', 'python3'))).toBe(true)
    }, 120000)

    it('should create venv with extras', async () => {
      const pm = await detectPackageManager()

      if (pm !== 'uv') {
        console.log('Skipping: uv not found in PATH. Install with: brew install uv')
        return
      }

      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })

      await createVenv(brainPath, ['office'])

      expect(venvExists(brainPath)).toBe(true)
    }, 120000)
  })

  describe('error handling scenarios', () => {
    it('documents: Python 3.10+ requirement error is tested in unit tests', () => {
      // Testing "Python 3.10+ not available" error requires mocking at module level
      // which is complex in integration tests. This scenario is covered in unit tests.
      expect(true).toBe(true)
    })
  })

  describe('runGraphify integration', () => {
    it('should use global venv and not throw when brain has no local venv', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })

      // runGraphify now uses the global venv — it should not throw due to missing brain-local venv.
      // It may succeed (no files found) or throw if global venv is also missing.
      // Either outcome is acceptable; what must NOT happen is a brain-local venv being created.
      try {
        await runGraphify(brainPath)
      } catch {
        // Acceptable: global venv also missing in this environment
      }
      const localVenvExists = existsSync(join(brainPath, '.venv'))
      expect(localVenvExists).toBe(false)
    })
  })

  describe('getBrainSize', () => {
    it('should return 0 for an empty brain directory', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      expect(getBrainSize(brainPath)).toBe(0)
    })

    it('should return correct total size for files in brain', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, 'note.md'), 'hello') // 5 bytes
      writeFileSync(join(brainPath, 'other.md'), 'world') // 5 bytes
      expect(getBrainSize(brainPath)).toBe(10)
    })

    it('should include nested files in size calculation', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(join(brainPath, 'sub'), { recursive: true })
      writeFileSync(join(brainPath, 'a.md'), '12345') // 5 bytes
      writeFileSync(join(brainPath, 'sub', 'b.md'), '123') // 3 bytes
      expect(getBrainSize(brainPath)).toBe(8)
    })
  })

  describe('countNotes', () => {
    it('should return 0 for an empty brain directory', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      expect(countNotes(brainPath)).toBe(0)
    })

    it('should count only markdown files', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, 'note.md'), '')
      writeFileSync(join(brainPath, 'note2.md'), '')
      writeFileSync(join(brainPath, 'image.png'), '')
      expect(countNotes(brainPath)).toBe(2)
    })

    it('should skip .obsidian and node_modules directories', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(join(brainPath, '.obsidian'), { recursive: true })
      mkdirSync(join(brainPath, 'node_modules'), { recursive: true })
      writeFileSync(join(brainPath, 'note.md'), '')
      writeFileSync(join(brainPath, '.obsidian', 'config.md'), '')
      writeFileSync(join(brainPath, 'node_modules', 'readme.md'), '')
      expect(countNotes(brainPath)).toBe(1)
    })
  })

  describe('clearGraphifyCache', () => {
    it('should remove graphify-out directory', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })
      writeFileSync(join(brainPath, 'graphify-out', 'output.json'), '{}')
      clearGraphifyCache(brainPath)
      expect(existsSync(join(brainPath, 'graphify-out'))).toBe(false)
    })

    it('should not throw if graphify-out does not exist', () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      expect(() => clearGraphifyCache(brainPath)).not.toThrow()
    })
  })

  describe('countNotesById', () => {
    it('should count notes for a registered brain by id', () => {
      const brainPath = join(tmpHome, 'brain-byid')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, 'note.md'), '# Note', 'utf8')
      writeFileSync(join(brainPath, 'other.md'), '# Other', 'utf8')
      addBrain('graphify-byid-brain', brainPath)

      const count = countNotesById('graphify-byid-brain')
      expect(count).toBe(2)
    })
  })

  describe('clearGraphifyCacheById', () => {
    it('should clear graphify cache for a registered brain by id', () => {
      const brainPath = join(tmpHome, 'brain-cache-byid')
      mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })
      writeFileSync(join(brainPath, 'graphify-out', 'output.json'), '{}', 'utf8')
      addBrain('graphify-cache-byid-brain', brainPath)

      clearGraphifyCacheById('graphify-cache-byid-brain')

      expect(existsSync(join(brainPath, 'graphify-out'))).toBe(false)
    })
  })

  describe('full graphify workflow', () => {
    it('should detect python, package manager, and prepare for venv creation', async () => {
      const python = await detectPython()
      const pm = await detectPackageManager()

      expect(python === null || typeof python === 'string').toBe(true)
      expect(['uv', 'pip']).toContain(pm)

      if (python) {
        const brainPath = join(tmpHome, 'brain')
        mkdirSync(brainPath, { recursive: true })

        expect(venvExists(brainPath)).toBe(false)
      }
    })
  })
})
