import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
    green: vi.fn((s) => s),
    cyan: vi.fn((s) => s)
  }
}))

describe('config', () => {
  let tmpHome

  beforeEach(async () => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-test-'))
    process.env.__HOME__ = tmpHome

    const { ensureConfigDir, writeConfig } = await import('../src/config.js')
    ensureConfigDir()
    writeConfig({ brains: {} })
  })

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true })
    delete process.env.__HOME__
  })

  describe('resolveBrain', () => {
    it('should resolve brain by id from config', async () => {
      const { addBrain, resolveBrain } = await import('../src/config.js')
      addBrain('work', join(tmpHome, 'work'))
      const resolved = resolveBrain('work')
      expect(resolved.id).toBe('work')
      expect(resolved.isLocal).toBe(false)
    })

    it('should throw when brain id not found', async () => {
      const { resolveBrain } = await import('../src/config.js')
      expect(() => resolveBrain('nonexistent')).toThrow('not found')
    })

    it('should throw when no brains configured', async () => {
      const { writeConfig, resolveBrain } = await import('../src/config.js')
      writeConfig({ brains: {} })
      expect(() => resolveBrain()).toThrow('No brains configured')
    })

    it('should throw when not in brain folder and no args', async () => {
      const { addBrain, resolveBrain } = await import('../src/config.js')
      addBrain('work', join(tmpHome, 'work'))
      expect(() => resolveBrain()).toThrow('Not in a brain folder')
    })
  })

  describe('listBrains', () => {
    it('should return empty array when no brains', async () => {
      const { listBrains } = await import('../src/config.js')
      expect(listBrains()).toEqual([])
    })

    it('should return list of brains', async () => {
      const { addBrain, listBrains } = await import('../src/config.js')
      addBrain('work', join(tmpHome, 'work'))
      addBrain('personal', join(tmpHome, 'personal'))
      const brains = listBrains()
      expect(brains.length).toBe(2)
    })
  })

  describe('addBrain', () => {
    it('should add brain to config', async () => {
      const { addBrain, readConfig } = await import('../src/config.js')
      addBrain('work', join(tmpHome, 'work'))
      const config = readConfig()
      expect(config.brains.work).toBe(join(tmpHome, 'work'))
    })

    it('should expand tilde in path', async () => {
      const { addBrain, readConfig } = await import('../src/config.js')
      addBrain('work', '~/work')
      const config = readConfig()
      expect(config.brains.work).toContain('ai-brain-test-')
    })
  })

  describe('removeBrain', () => {
    it('should remove brain from config', async () => {
      const { addBrain, removeBrain, readConfig } = await import('../src/config.js')
      addBrain('work', join(tmpHome, 'work'))
      removeBrain('work')
      const config = readConfig()
      expect(config.brains.work).toBeUndefined()
    })

    it('should throw when brain not found', async () => {
      const { removeBrain } = await import('../src/config.js')
      expect(() => removeBrain('nonexistent')).toThrow('not found')
    })
  })
})