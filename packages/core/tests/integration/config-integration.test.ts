import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, PathLike } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  ensureConfigDir,
  writeConfig,
  addBrain,
  readConfig,
  configPath,
  removeBrain,
  resolveBrain,
  getBrainPath
} from '@ai-brain/core/config'
import { readLocalBrainConfig, writeBrainConfig } from '@ai-brain/core/scaffold'

describe('config integration', () => {
  let tmpHome: PathLike
  let originalCwd: { (): string; (): string }

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
      ensureConfigDir()
      writeConfig({ brains: {} })

      expect(existsSync(configPath())).toBe(true)

      const brainPath = join(tmpHome.toString(), 'mybrain')
      mkdirSync(brainPath, { recursive: true })
      addBrain('test', brainPath)

      const config = readConfig()
      expect(config.brains.test).toBe(brainPath)
    })

    it('should handle tilde expansion in paths', async () => {
      addBrain('work', '~/work-brain')

      const config = readConfig()
      expect(config.brains.work).toContain(tmpHome)
    })

    it('should persist config across multiple operations', async () => {
      addBrain('brain1', join(tmpHome.toString(), 'brain1'))
      addBrain('brain2', join(tmpHome.toString(), 'brain2'))

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
      const brainPath = join(tmpHome.toString(), 'work')
      mkdirSync(brainPath, { recursive: true })

      addBrain('work', brainPath)
      const resolved = resolveBrain('work')

      expect(resolved.id).toBe('work')
      expect(resolved.path).toBe(brainPath)
      expect(resolved.isLocal).toBe(false)
    })

    it('should detect brain from cwd', async () => {
      const brainPath = join(tmpHome.toString(), 'mybrain')
      mkdirSync(brainPath, { recursive: true })

      addBrain('mybrain', brainPath)

      process.cwd = () => brainPath
      const resolved = resolveBrain()

      expect(resolved.id).toBe('mybrain')
      expect(resolved.isLocal).toBe(true)
    })

    it('should detect brain from cwd subdirectory', async () => {
      const brainPath = join(tmpHome.toString(), 'mybrain')
      const subDir = join(brainPath, 'notes')
      mkdirSync(subDir, { recursive: true })

      addBrain('mybrain', brainPath)

      process.cwd = () => subDir
      const resolved = resolveBrain()

      expect(resolved.id).toBe('mybrain')
      expect(resolved.isLocal).toBe(true)
    })

    it('should resolve from local .brain-config.json', async () => {
      const brainPath = join(tmpHome.toString(), 'localbrain')
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
      const brainPath = join(tmpHome.toString(), 'work')
      mkdirSync(brainPath, { recursive: true })

      addBrain('work', brainPath)
      const result = getBrainPath([], { brainId: 'work' })

      expect(result).toBe(brainPath)
    })

    it('should resolve from positional args', async () => {
      const brainPath = join(tmpHome.toString(), 'personal')
      mkdirSync(brainPath, { recursive: true })

      addBrain('personal', brainPath)
      const result = getBrainPath(['personal'], {})

      expect(result).toBe(brainPath)
    })

    it('should auto-detect from cwd when no args provided', async () => {
      const brainPath = join(tmpHome.toString(), 'work')
      mkdirSync(brainPath, { recursive: true })

      addBrain('work', brainPath)

      process.cwd = () => brainPath
      const result = getBrainPath([], {})

      expect(result).toBe(brainPath)
    })

    it('should provide helpful error when no brain configured', async () => {
      writeConfig({ brains: {} })

      expect(() => getBrainPath([], {})).toThrow('No brain configured')
    })

    it('should provide helpful error with available brains when not in brain folder', async () => {
      const brainPath = join(tmpHome.toString(), 'work')
      mkdirSync(brainPath, { recursive: true })

      addBrain('work', brainPath)

      process.cwd = () => tmpHome.toString()
      expect(() => getBrainPath([], {})).toThrow('Not in a brain folder')
    })
  })

  describe('readBrainConfig integration', () => {
    it('should read full brain config', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })

      writeBrainConfig({
        brainPath,
        gitSync: true,
        extras: ['office', 'video'],
        obsidianDir: '/obsidian'
      })

      const config = readLocalBrainConfig(brainPath)
      expect(config.gitSync).toBe(true)
      expect(config.extras).toEqual(['office', 'video'])
      expect(config.obsidianDir).toBe('/obsidian')
    })

    it('should return defaults when config missing', async () => {
      const brainPath = join(tmpHome.toString(), 'nonexistent')

      const config = readLocalBrainConfig(brainPath)
      expect(config.gitSync).toBe(false)
      expect(config.extras).toEqual([])
      expect(config.obsidianDir).toBeNull()
    })
  })
})
