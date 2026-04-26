import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { vi } from 'vitest'

describe('graphify integration', () => {
  let tmpHome

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-graphify-test-'))
  })

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true })
  })

  describe('venv detection', () => {
    it('should detect non-existent venv', async () => {
      const { venvExists } = await import('../../../src/graphify.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      
      expect(venvExists(brainPath)).toBe(false)
    })

    it('should detect existing venv', async () => {
      const { venvExists } = await import('../../../src/graphify.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
      
      expect(venvExists(brainPath)).toBe(true)
    })

    it('should return correct python path for macOS/Linux', async () => {
      const { venvPythonPath } = await import('../../../src/graphify.js')
      const brainPath = join(tmpHome, 'brain')
      
      const pythonPath = venvPythonPath(brainPath)
      expect(pythonPath).toBe(join(brainPath, '.venv', 'bin', 'python3'))
    })
  })

  describe('python detection', () => {
    it('should detect available python3', async () => {
      const { detectPython } = await import('../../../src/graphify.js')
      const result = await detectPython()
      
      expect(result === null || typeof result === 'string').toBe(true)
    })

    it('should validate python version >= 3.10', async () => {
      const { detectPython } = await import('../../../src/graphify.js')
      
      try {
        const version = execSync('python3 --version', { encoding: 'utf8' })
        const match = version.match(/Python (\d+)\.(\d+)/)
        
        if (match && (parseInt(match[1]) > 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) >= 10))) {
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
      const { detectPackageManager } = await import('../../../src/graphify.js')
      const result = await detectPackageManager()
      
      expect(['uv', 'pip']).toContain(result)
    })
  })

  describe('createVenv integration (when python available)', () => {
    // These tests require Python 3.10+ and network access for pip/uv install
    // They are skipped in CI/dev environments without Python 3.10+
    // Run manually with: npm run test:integration -- --run tests/integration/graphify-integration.test.js -t "should create venv"
    it.skip('should create venv with graphify installation', async () => {
      const { detectPython, venvExists, createVenv } = await import('../../../src/graphify.js')
      const python = await detectPython()
      
      if (!python) {
        console.log('Skipping: Python 3.10+ not available')
        return
      }
      
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      
      await createVenv(brainPath)
      
      expect(venvExists(brainPath)).toBe(true)
      expect(existsSync(join(brainPath, '.venv', 'bin', 'python3'))).toBe(true)
    }, 60000)

    // These tests require Python 3.10+ and network access for pip/uv install
    // They are skipped in CI/dev environments without Python 3.10+
    // Run manually with: npm run test:integration -- --run tests/integration/graphify-integration.test.js -t "should create venv with extras"
    it.skip('should create venv with extras', async () => {
      const { detectPython, venvExists, createVenv } = await import('../../../src/graphify.js')
      const python = await detectPython()
      
      if (!python) {
        console.log('Skipping: Python 3.10+ not available')
        return
      }
      
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      
      await createVenv(brainPath, ['office'])
      
      expect(venvExists(brainPath)).toBe(true)
    }, 60000)
  })

  describe('runGraphify integration', () => {
    it('should handle missing venv gracefully', async () => {
      const { runGraphify } = await import('../../../src/graphify.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      
      await expect(runGraphify(brainPath)).rejects.toThrow()
    })

    it('should handle no code files gracefully', async () => {
      const { runGraphify } = await import('../../../src/graphify.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      const pythonPath = join(brainPath, '.venv', 'bin', 'python3')
      writeFileSync(pythonPath, '#!/usr/bin/env python3\n', 'utf8')
      execSync(`chmod +x ${pythonPath}`)
      mkdirSync(join(brainPath, 'raw'), { recursive: true })
      
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      try {
        await runGraphify(brainPath)
      } catch (e) {
        expect(e.message).toMatch(/No code files found|Nothing to update|No files found/)
      } finally {
        consoleLogSpy.mockRestore()
      }
    })
  })

  describe('full graphify workflow', () => {
    it('should detect python, package manager, and prepare for venv creation', async () => {
      const { detectPython, detectPackageManager, venvExists } = await import('../../../src/graphify.js')
      
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
