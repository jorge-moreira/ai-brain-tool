import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  ensureConfigDir,
  writeConfig,
  readConfig,
  resolveBrain,
  listBrains,
  addBrain,
  removeBrain,
  isBrainIdAvailable,
  readBrainConfig,
  getBrainPath,
  isInstallationComplete,
  setInstallationComplete,
  addGraphifyyExtra,
  type Config
} from '@ai-brain/core/config'

const emptyConfig: Config = {
  installationComplete: false,
  graphifyyExtras: [],
  aiTools: [],
  brains: {}
}

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    cyan: vi.fn((s: string) => s)
  }
}))

describe('config', () => {
  let tmpHome: string

  beforeEach(async () => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-test-'))
    process.env.__HOME__ = tmpHome

    ensureConfigDir()
    writeConfig(emptyConfig)
  })

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true })
    delete process.env.__HOME__
  })

  describe('isInstallationComplete', () => {
    it('should return false when config file does not exist', async () => {
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      expect(isInstallationComplete()).toBe(false)
    })

    it('should return false when installationComplete is not set', async () => {
      writeConfig({ installationComplete: false, graphifyyExtras: [], aiTools: [], brains: {} })
      expect(isInstallationComplete()).toBe(false)
    })

    it('should return false when installationComplete is false', async () => {
      writeConfig({ installationComplete: false, graphifyyExtras: [], aiTools: [], brains: {} })
      expect(isInstallationComplete()).toBe(false)
    })

    it('should return true when installationComplete is true', async () => {
      writeConfig({ installationComplete: true, graphifyyExtras: [], aiTools: [], brains: {} })
      expect(isInstallationComplete()).toBe(true)
    })

    it('should return false when config is invalid JSON', async () => {
      writeFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'invalid json {{{', 'utf8')
      expect(isInstallationComplete()).toBe(false)
    })
  })

  describe('setInstallationComplete', () => {
    it('should set installationComplete to true in existing config', async () => {
      writeConfig({ installationComplete: false, graphifyyExtras: [], aiTools: [], brains: {} })
      setInstallationComplete()
      const config = readConfig()
      expect(config.installationComplete).toBe(true)
    })

    it('should create config and set installationComplete to true', async () => {
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      setInstallationComplete()
      const config = readConfig()
      expect(config.installationComplete).toBe(true)
    })
  })

  describe('addGraphifyyExtra', () => {
    it('should add extra to existing config', async () => {
      writeConfig({ installationComplete: true, graphifyyExtras: [], aiTools: [], brains: {} })
      addGraphifyyExtra('office')
      const config = readConfig()
      expect(config.graphifyyExtras).toContain('office')
    })

    it('should not add duplicate extras', async () => {
      writeConfig({
        installationComplete: true,
        graphifyyExtras: ['office'],
        aiTools: [],
        brains: {}
      })
      addGraphifyyExtra('office')
      const config = readConfig()
      expect(config.graphifyyExtras.filter(e => e === 'office').length).toBe(1)
    })

    it('should create config if not exists', async () => {
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      addGraphifyyExtra('video')
      const config = readConfig()
      expect(config.graphifyyExtras).toContain('video')
    })

    it('should add multiple extras', async () => {
      writeConfig({ installationComplete: true, graphifyyExtras: [], aiTools: [], brains: {} })
      addGraphifyyExtra('office')
      addGraphifyyExtra('video')
      const config = readConfig()
      expect(config.graphifyyExtras).toEqual(['office', 'video'])
    })
  })

  describe('resolveBrain', () => {
    it('should resolve brain by id from config', async () => {
      addBrain('work', join(tmpHome, 'work'))
      const resolved = resolveBrain('work')
      expect(resolved.id).toBe('work')
      expect(resolved.isLocal).toBe(false)
    })

    it('should throw when brain id not found', async () => {
      expect(() => resolveBrain('nonexistent')).toThrow('not found')
    })

    it('should throw when no brains configured', async () => {
      writeConfig(emptyConfig)
      expect(() => resolveBrain()).toThrow('No brains configured')
    })

    it('should throw when not in brain folder and no args', async () => {
      addBrain('work', join(tmpHome, 'work'))
      expect(() => resolveBrain()).toThrow('Not in a brain folder')
    })

    it('should throw when brains is undefined in config', async () => {
      const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
      writeFileSync(
        configPath,
        JSON.stringify({ installationComplete: true, graphifyyExtras: [], aiTools: [] }),
        'utf8'
      )
      expect(() => resolveBrain()).toThrow('No brains configured')
    })

    it('should resolve brain when cwd matches brain path', async () => {
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
  })

  describe('listBrains', () => {
    it('should return empty array when no brains', async () => {
      expect(listBrains()).toEqual([])
    })

    it('should return list of brains', async () => {
      addBrain('work', join(tmpHome, 'work'))
      addBrain('personal', join(tmpHome, 'personal'))
      const brains = listBrains()
      expect(brains.length).toBe(2)
    })
  })

  describe('addBrain', () => {
    it('should add brain to config', async () => {
      addBrain('work', join(tmpHome, 'work'))
      const config = readConfig()
      expect(config.brains.work).toBe(join(tmpHome, 'work'))
    })

    it('should expand tilde in path', async () => {
      addBrain('work', '~/work')
      const config = readConfig()
      expect(config.brains.work).toContain('ai-brain-test-')
    })

    it('should create config if not exists', async () => {
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      addBrain('work', join(tmpHome, 'work'))
      const config = readConfig()
      expect(config.brains.work).toBeDefined()
    })
  })

  describe('removeBrain', () => {
    it('should remove brain from config', async () => {
      addBrain('work', join(tmpHome, 'work'))
      removeBrain('work')
      const config = readConfig()
      expect(config.brains.work).toBeUndefined()
    })

    it('should throw when brain not found', async () => {
      expect(() => removeBrain('nonexistent')).toThrow('not found')
    })
  })

  describe('isBrainIdAvailable', () => {
    it('should return true when brain id is available', async () => {
      expect(isBrainIdAvailable('newbrain')).toBe(true)
    })

    it('should return false when brain id is taken', async () => {
      addBrain('work', join(tmpHome, 'work'))
      expect(isBrainIdAvailable('work')).toBe(false)
    })

    it('should return true when config does not exist', async () => {
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      expect(isBrainIdAvailable('anybrain')).toBe(true)
    })
  })

  describe('readBrainConfig', () => {
    it('should return defaults when file does not exist', async () => {
      const config = readBrainConfig(join(tmpHome, 'nonexistent'))
      expect(config.gitSync).toBe(false)
      expect(config.obsidianDir).toBeNull()
    })

    it('should read existing brain config', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({
          gitSync: true,
          obsidianDir: '/obsidian'
        })
      )
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(true)
      expect(config.obsidianDir).toBe('/obsidian')
    })

    it('should return defaults when config file is invalid JSON', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, '.brain-config.json'), 'invalid json {{{')
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(false)
      expect(config.obsidianDir).toBeNull()
    })
  })

  describe('readConfig', () => {
    it('should throw parse error when config is invalid JSON', async () => {
      writeFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'invalid json {{{', 'utf8')
      expect(() => readConfig()).toThrow('Config parse error')
    })
  })

  describe('getBrainPath', () => {
    it('should resolve brain from options.brainId', async () => {
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      addBrain('work', brainPath)

      const result = getBrainPath([], { brainId: 'work' })
      expect(result).toBe(brainPath)
    })

    it('should resolve brain from positional args', async () => {
      const brainPath = join(tmpHome, 'personal')
      mkdirSync(brainPath, { recursive: true })
      addBrain('personal', brainPath)

      const result = getBrainPath(['personal'], {})
      expect(result).toBe(brainPath)
    })

    it('should detect brain from cwd', async () => {
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      addBrain('work', brainPath)

      const originalCwd = process.cwd
      process.cwd = () => brainPath
      try {
        const result = getBrainPath([], {})
        expect(result).toBe(brainPath)
      } finally {
        process.cwd = originalCwd
      }
    })

    it('should detect brain from cwd subdirectory', async () => {
      const brainPath = join(tmpHome, 'work')
      const subDir = join(brainPath, 'subfolder')
      mkdirSync(subDir, { recursive: true })
      addBrain('work', brainPath)

      const originalCwd = process.cwd
      process.cwd = () => subDir
      try {
        const result = getBrainPath([], {})
        expect(result).toBe(brainPath)
      } finally {
        process.cwd = originalCwd
      }
    })

    it('should throw when no brains configured', async () => {
      writeConfig(emptyConfig)

      expect(() => getBrainPath([], {})).toThrow('No brain configured')
    })

    it('should throw when brains is undefined in config', async () => {
      const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
      writeFileSync(
        configPath,
        JSON.stringify({ installationComplete: true, graphifyyExtras: [], aiTools: [] }),
        'utf8'
      )

      expect(() => getBrainPath([], {})).toThrow('No brain configured')
    })

    it('should throw with available brains when not in brain folder', async () => {
      const brainPath = join(tmpHome, 'work')
      mkdirSync(brainPath, { recursive: true })
      addBrain('work', brainPath)

      expect(() => getBrainPath([], {})).toThrow('Not in a brain folder')
    })
  })

  describe('listBrains', () => {
    it('should return empty array when no brains configured', async () => {
      writeConfig(emptyConfig)
      expect(listBrains()).toEqual([])
    })

    it('should return empty array when brains is undefined', async () => {
      const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
      writeFileSync(
        configPath,
        JSON.stringify({ installationComplete: false, graphifyyExtras: [], aiTools: [] }),
        'utf8'
      )
      expect(listBrains()).toEqual([])
    })
  })

  describe('addBrain', () => {
    it('should create config if not exists and add brain', async () => {
      rmSync(join(tmpHome, '.ai-brain-tool', 'config.json'), { force: true })
      addBrain('newbrain', join(tmpHome, 'newbrain'))
      const config = readConfig()
      expect(config.brains.newbrain).toBeDefined()
    })

    it('should initialize brains when config exists but brains is undefined', async () => {
      const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
      writeFileSync(
        configPath,
        JSON.stringify({ installationComplete: true, graphifyyExtras: [], aiTools: [] }),
        'utf8'
      )
      addBrain('testbrain', join(tmpHome, 'testbrain'))
      const config = readConfig()
      expect(config.brains.testbrain).toBeDefined()
    })
  })
})
