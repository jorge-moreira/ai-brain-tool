import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('ensureUv integration', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ai-brain-uv-test-'))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('ensureUv function', () => {
    it('should detect uv if already installed', async () => {
      const { ensureUv } = await import('../../../src/graphify.js')
      
      // This test will pass if uv is installed, or install it if not
      await ensureUv()
      
      // If we get here without throwing, uv is now available
      expect(true).toBe(true)
    }, 60000)

    it('should make uv available for subsequent calls', async () => {
      const { ensureUv, detectPackageManager } = await import('../../../src/graphify.js')
      
      await ensureUv()
      
      const pm = await detectPackageManager()
      expect(pm).toBe('uv')
    }, 60000)

    it('should add uv to PATH if installed during execution', async () => {
      const { ensureUv } = await import('../../../src/graphify.js')
      const { homedir } = await import('os')
      
      const uvBinDir = join(homedir(), '.local', 'bin')
      const pathBefore = process.env.PATH || ''
      
      await ensureUv()
      
      const pathAfter = process.env.PATH || ''
      // PATH should now include uv bin directory
      expect(pathAfter.includes(uvBinDir)).toBe(true)
    }, 60000)
  })

  describe('createVenv with auto uv install', () => {
    it('should install uv then create venv', async () => {
      const { createVenv, venvExists } = await import('../../../src/graphify.js')
      
      const brainPath = join(tmpDir, 'brain')
      rmSync(brainPath, { recursive: true, force: true })
      
      await createVenv(brainPath)
      
      expect(venvExists(brainPath)).toBe(true)
    }, 120000)

    it('should install uv then create venv with extras', async () => {
      const { createVenv, venvExists } = await import('../../../src/graphify.js')
      
      const brainPath = join(tmpDir, 'brain')
      rmSync(brainPath, { recursive: true, force: true })
      
      await createVenv(brainPath, ['office'])
      
      expect(venvExists(brainPath)).toBe(true)
    }, 120000)
  })

  describe('upgradeVenv with auto uv install', () => {
    it('should install uv then upgrade venv', async () => {
      const { createVenv, upgradeVenv, venvExists } = await import('../../../src/graphify.js')
      
      const brainPath = join(tmpDir, 'brain')
      rmSync(brainPath, { recursive: true, force: true })
      
      // Create venv first
      await createVenv(brainPath)
      expect(venvExists(brainPath)).toBe(true)
      
      // Upgrade should also ensure uv is available
      await upgradeVenv(brainPath)
      
      expect(venvExists(brainPath)).toBe(true)
    }, 180000)
  })
})
