import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  configPath,
  createInitialConfig,
  ensureConfigDir,
  readConfig,
  writeConfig,
  updateConfig,
  isInstallationComplete,
  setInstallationComplete,
  addGraphifyyExtra
} from '@ai-brain/core/config'

describe('config/state integration', () => {
  let tmpHome: string
  let originalHome: string | undefined

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-state-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
  })

  afterEach(() => {
    process.env.HOME = originalHome
    rmSync(tmpHome, { recursive: true, force: true })
  })

  describe('createInitialConfig', () => {
    it('should return default config', () => {
      const cfg = createInitialConfig()
      expect(cfg.installationComplete).toBe(false)
      expect(cfg.graphifyyExtras).toEqual([])
      expect(cfg.aiTools).toEqual([])
      expect(cfg.brains).toEqual({})
    })
  })

  describe('ensureConfigDir', () => {
    it('should create config directory', () => {
      ensureConfigDir()
      expect(existsSync(join(tmpHome, '.ai-brain-tool'))).toBe(true)
    })
  })

  describe('writeConfig / readConfig', () => {
    it('should write and read config', () => {
      const cfg = createInitialConfig()
      cfg.installationComplete = true
      cfg.graphifyyExtras = ['office']
      writeConfig(cfg)

      const read = readConfig()
      expect(read.installationComplete).toBe(true)
      expect(read.graphifyyExtras).toEqual(['office'])
    })

    it('should read config file created by writeConfig', () => {
      writeConfig(createInitialConfig())
      const raw = JSON.parse(readFileSync(configPath(), 'utf8'))
      expect(raw.installationComplete).toBe(false)
    })

    it('should throw when config does not exist', () => {
      const cfgPath = configPath()
      if (existsSync(cfgPath)) rmSync(cfgPath)
      expect(() => readConfig()).toThrow('Config not found')
    })
  })

  describe('updateConfig', () => {
    it('should create config if missing and apply mutation', () => {
      updateConfig(c => {
        c.installationComplete = true
        c.aiTools = ['claude']
      })

      const cfg = readConfig()
      expect(cfg.installationComplete).toBe(true)
      expect(cfg.aiTools).toEqual(['claude'])
    })

    it('should modify existing config', () => {
      writeConfig(createInitialConfig())
      updateConfig(c => {
        c.graphifyyExtras.push('video')
      })

      const cfg = readConfig()
      expect(cfg.graphifyyExtras).toEqual(['video'])
    })
  })

  describe('isInstallationComplete', () => {
    it('should return false when no config', () => {
      expect(isInstallationComplete()).toBe(false)
    })

    it('should return false when not complete', () => {
      writeConfig(createInitialConfig())
      expect(isInstallationComplete()).toBe(false)
    })

    it('should return true when complete', () => {
      const cfg = createInitialConfig()
      cfg.installationComplete = true
      writeConfig(cfg)
      expect(isInstallationComplete()).toBe(true)
    })
  })

  describe('setInstallationComplete', () => {
    it('should set installation complete flag', () => {
      setInstallationComplete()
      expect(isInstallationComplete()).toBe(true)
    })
  })

  describe('addGraphifyyExtra', () => {
    it('should add extra to config', () => {
      addGraphifyyExtra('office')
      const cfg = readConfig()
      expect(cfg.graphifyyExtras).toContain('office')
    })

    it('should not duplicate extras', () => {
      addGraphifyyExtra('office')
      addGraphifyyExtra('office')
      const cfg = readConfig()
      expect(cfg.graphifyyExtras).toEqual(['office'])
    })
  })
})
