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

    it('should resolve brain when cwd matches brain path', async () => {
      const { addBrain, resolveBrain } = await import('../src/config.js')
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      addBrain('work', brainPath)
      const originalCwd = process.cwd
      process.cwd = () => brainPath
      try {
        const resolved = resolveBrain()
        expect(resolved.id).toBe('work')
      } finally {
        process.cwd = originalCwd
      }
    })

    it('should resolve from local .brain-config.json in cwd', async () => {
      const { resolveBrain } = await import('../src/config.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, '.brain-config.json'), JSON.stringify({ id: 'mybrain' }))
      const originalCwd = process.cwd
      process.cwd = () => brainPath
      try {
        const resolved = resolveBrain()
        expect(resolved.id).toBe('mybrain')
      } finally {
        process.cwd = originalCwd
        rmSync(join(brainPath, '.brain-config.json'))
      }
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

    it('should create config if not exists', async () => {
      const { removeBrain, addBrain, readConfig } = await import('../src/config.js')
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      addBrain('work', join(tmpHome, 'work'))
      const config = readConfig()
      expect(config.brains.work).toBeDefined()
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

  describe('isBrainIdAvailable', () => {
    it('should return true when brain id is available', async () => {
      const { isBrainIdAvailable } = await import('../src/config.js')
      expect(isBrainIdAvailable('newbrain')).toBe(true)
    })

    it('should return false when brain id is taken', async () => {
      const { addBrain, isBrainIdAvailable } = await import('../src/config.js')
      addBrain('work', join(tmpHome, 'work'))
      expect(isBrainIdAvailable('work')).toBe(false)
    })

    it('should return true when config does not exist', async () => {
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      const { isBrainIdAvailable } = await import('../src/config.js')
      expect(isBrainIdAvailable('anybrain')).toBe(true)
    })
  })

  describe('readBrainConfig', () => {
    it('should return defaults when file does not exist', async () => {
      const { readBrainConfig } = await import('../src/config.js')
      const config = readBrainConfig(join(tmpHome, 'nonexistent'))
      expect(config.gitSync).toBe(false)
      expect(config.extras).toEqual([])
      expect(config.obsidianDir).toBeNull()
      expect(config.id).toBeNull()
    })

    it('should read existing brain config', async () => {
      const { readBrainConfig } = await import('../src/config.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, '.brain-config.json'), JSON.stringify({
        gitSync: true,
        extras: ['office'],
        obsidianDir: '/obsidian'
      }))
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(true)
      expect(config.extras).toEqual(['office'])
      expect(config.obsidianDir).toBe('/obsidian')
    })

    it('should return defaults when config file is invalid JSON', async () => {
      const { readBrainConfig } = await import('../src/config.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, '.brain-config.json'), 'invalid json {{{')
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(false)
      expect(config.extras).toEqual([])
      expect(config.obsidianDir).toBeNull()
      expect(config.id).toBeNull()
    })
  })

  describe('readConfig', () => {
    it('should throw CONFIG_PARSE_ERROR when config is invalid JSON', async () => {
      writeFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'invalid json {{{', 'utf8')
      const { readConfig } = await import('../src/config.js')
      expect(() => readConfig()).toThrow('CONFIG_PARSE_ERROR')
    })
  })
})