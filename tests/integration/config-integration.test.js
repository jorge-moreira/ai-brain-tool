import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('config integration', () => {
  let tmpHome
  let originalCwd

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-config-test-'))
    originalCwd = process.cwd
    process.env.__HOME__ = tmpHome
  })

  afterEach(() => {
    process.cwd = originalCwd
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  describe('full config workflow', () => {
    it('should create config dir, write config, add brain, and read it back', async () => {
      const { ensureConfigDir, writeConfig, addBrain, readConfig, configPath } = await import('../../../src/config.js')
      
      ensureConfigDir()
      writeConfig({ brains: {} })
      
      expect(existsSync(configPath())).toBe(true)
      
      const brainPath = join(tmpHome, 'mybrain')
      mkdirSync(brainPath, { recursive: true })
      addBrain('test', brainPath)
      
      const config = readConfig()
      expect(config.brains.test).toBe(brainPath)
    })

    it('should handle tilde expansion in paths', async () => {
      const { addBrain, readConfig } = await import('../../../src/config.js')
      
      addBrain('work', '~/work-brain')
      
      const config = readConfig()
      expect(config.brains.work).toContain(tmpHome)
    })

    it('should persist config across multiple operations', async () => {
      const { addBrain, readConfig, removeBrain } = await import('../../../src/config.js')
      
      addBrain('brain1', join(tmpHome, 'brain1'))
      addBrain('brain2', join(tmpHome, 'brain2'))
      
      let config = readConfig()
      expect(Object.keys(config.brains).length).toBe(2)
      
      removeBrain('brain1')
      
      config = readConfig()
      expect(config.brains.brain1).toBeUndefined()
      expect(config.brains.brain2).toBeDefined()
    })
  })

  describe('resolveBrain integration', () => {
    it('should resolve brain by id', async () => {
      const { addBrain, resolveBrain } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      
      addBrain('work', brainPath)
      const resolved = resolveBrain('work')
      
      expect(resolved.id).toBe('work')
      expect(resolved.path).toBe(brainPath)
      expect(resolved.isLocal).toBe(false)
    })

    it('should detect brain from cwd', async () => {
      const { addBrain, resolveBrain } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'mybrain')
      mkdirSync(brainPath, { recursive: true })
      
      addBrain('mybrain', brainPath)
      
      process.cwd = () => brainPath
      const resolved = resolveBrain()
      
      expect(resolved.id).toBe('mybrain')
      expect(resolved.isLocal).toBe(true)
    })

    it('should detect brain from cwd subdirectory', async () => {
      const { addBrain, resolveBrain } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'mybrain')
      const subDir = join(brainPath, 'notes')
      mkdirSync(subDir, { recursive: true })
      
      addBrain('mybrain', brainPath)
      
      process.cwd = () => subDir
      const resolved = resolveBrain()
      
      expect(resolved.id).toBe('mybrain')
      expect(resolved.isLocal).toBe(true)
    })

    it('should resolve from local .brain-config.json', async () => {
      const { resolveBrain, writeConfig } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'localbrain')
      mkdirSync(brainPath, { recursive: true })
      
      writeConfig({ brains: {} })
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({ id: 'localbrain' }),
        'utf8'
      )
      
      process.cwd = () => brainPath
      const resolved = resolveBrain()
      
      expect(resolved.id).toBe('localbrain')
      expect(resolved.path).toBe(brainPath)
    })
  })

  describe('getBrainPath integration', () => {
    it('should resolve from options.brainId', async () => {
      const { addBrain, getBrainPath } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      
      addBrain('work', brainPath)
      const result = getBrainPath([], { brainId: 'work' })
      
      expect(result).toBe(brainPath)
    })

    it('should resolve from positional args', async () => {
      const { addBrain, getBrainPath } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'personal')
      mkdirSync(brainPath, { recursive: true })
      
      addBrain('personal', brainPath)
      const result = getBrainPath(['personal'], {})
      
      expect(result).toBe(brainPath)
    })

    it('should auto-detect from cwd when no args provided', async () => {
      const { addBrain, getBrainPath } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      
      addBrain('work', brainPath)
      
      process.cwd = () => brainPath
      const result = getBrainPath([], {})
      
      expect(result).toBe(brainPath)
    })

    it('should provide helpful error when no brain configured', async () => {
      const { writeConfig, getBrainPath } = await import('../../../src/config.js')
      writeConfig({ brains: {} })
      
      expect(() => getBrainPath([], {})).toThrow('No brain configured')
    })

    it('should provide helpful error with available brains when not in brain folder', async () => {
      const { addBrain, getBrainPath } = await import('../../../src/config.js')
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      
      addBrain('work', brainPath)
      
      process.cwd = () => tmpHome
      expect(() => getBrainPath([], {})).toThrow('Not in a brain folder')
    })
  })

  describe('readBrainConfig integration', () => {
    it('should read full brain config', async () => {
      const { writeBrainConfig, readBrainConfig } = await import('../../../src/scaffold.js')
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      
      writeBrainConfig({
        brainPath,
        gitSync: true,
        extras: ['office', 'video'],
        obsidianDir: '/obsidian'
      })
      
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(true)
      expect(config.extras).toEqual(['office', 'video'])
      expect(config.obsidianDir).toBe('/obsidian')
    })

    it('should return defaults when config missing', async () => {
      const { readBrainConfig } = await import('../../../src/scaffold.js')
      const brainPath = join(tmpHome, 'nonexistent')
      
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(false)
      expect(config.extras).toEqual([])
      expect(config.obsidianDir).toBeNull()
    })
  })
})
