import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('scaffold integration', () => {
  let tmpHome

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-scaffold-test-'))
  })

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true })
  })

  describe('createBrainFolder with real file system', () => {
    it('should create complete directory structure', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      
      const { createBrainFolder } = await import('../../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: false })
      
      expect(existsSync(join(brainPath, 'raw', 'notes'))).toBe(true)
      expect(existsSync(join(brainPath, 'raw', 'articles'))).toBe(true)
      expect(existsSync(join(brainPath, 'raw', 'projects'))).toBe(true)
      expect(existsSync(join(brainPath, 'raw', 'documentation'))).toBe(true)
      expect(existsSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'))).toBe(true)
      expect(existsSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom'))).toBe(true)
      expect(existsSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'))).toBe(true)
      expect(existsSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom'))).toBe(true)
      expect(existsSync(join(brainPath, 'graphify-out'))).toBe(true)
    })

    it('should write .graphifyignore file', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      
      const { createBrainFolder } = await import('../../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: false })
      
      const graphifyignorePath = join(brainPath, '.graphifyignore')
      expect(existsSync(graphifyignorePath)).toBe(true)
      
      const content = readFileSync(graphifyignorePath, 'utf8')
      expect(content).toContain('raw/templates/')
      expect(content).toContain('node_modules/')
    })

    it('should copy bundled markdown templates', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      
      const { createBrainFolder } = await import('../../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: false })
      
      const bundledDir = join(brainPath, 'raw', 'templates', 'markdown', '_bundled')
      const templates = readdirSync(bundledDir)
      
      expect(templates.length).toBeGreaterThan(0)
      expect(templates).toContain('book-template.md')
      expect(templates).toContain('meeting-template.md')
      expect(templates).toContain('project-template.md')
    })

    it('should copy bundled web-clipper templates', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      
      const { createBrainFolder } = await import('../../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: false })
      
      const clipperDir = join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled')
      expect(existsSync(clipperDir)).toBe(true)
      
      const templates = readdirSync(clipperDir)
      expect(templates.length).toBeGreaterThan(0)
    })

    it('should create .obsidian folder when includeObsidian is true', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      
      const { createBrainFolder } = await import('../../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: true })
      
      expect(existsSync(join(brainPath, '.obsidian'))).toBe(true)
      expect(existsSync(join(brainPath, '.obsidian', 'templates.json'))).toBe(true)
      expect(existsSync(join(brainPath, '.obsidian', 'app.json'))).toBe(true)
      expect(existsSync(join(brainPath, '.obsidian', 'appearance.json'))).toBe(true)
    })

    it('should not create .obsidian folder when includeObsidian is false', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      
      const { createBrainFolder } = await import('../../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: false })
      
      expect(existsSync(join(brainPath, '.obsidian'))).toBe(false)
    })
  })

  describe('writeBrainConfig integration', () => {
    it('should write complete brain config', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      mkdirSync(brainPath, { recursive: true })
      
      const { writeBrainConfig } = await import('../../../src/scaffold')
      writeBrainConfig({
        brainPath,
        gitSync: true,
        extras: ['office', 'video'],
        obsidianDir: '/path/to/vault'
      })
      
      const configPath = join(brainPath, '.brain-config.json')
      expect(existsSync(configPath)).toBe(true)
      
      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(config.gitSync).toBe(true)
      expect(config.extras).toEqual(['office', 'video'])
      expect(config.obsidianDir).toBe('/path/to/vault')
    })

    it('should write minimal config with defaults', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      mkdirSync(brainPath, { recursive: true })
      
      const { writeBrainConfig } = await import('../../../src/scaffold')
      writeBrainConfig({ brainPath, gitSync: false })
      
      const config = JSON.parse(readFileSync(join(brainPath, '.brain-config.json'), 'utf8'))
      expect(config.gitSync).toBe(false)
      expect(config.extras).toEqual([])
      expect(config.obsidianDir).toBeUndefined()
    })
  })

  describe('readBrainConfig integration', () => {
    it('should read existing brain config', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      mkdirSync(brainPath, { recursive: true })
      
      const { writeBrainConfig, readBrainConfig } = await import('../../../src/scaffold')
      writeBrainConfig({
        brainPath,
        gitSync: true,
        extras: ['office'],
        obsidianDir: '/vault'
      })
      
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(true)
      expect(config.extras).toEqual(['office'])
      expect(config.obsidianDir).toBe('/vault')
    })

    it('should return defaults for non-existent config', async () => {
      const brainPath = join(tmpHome, 'nonexistent')
      
      const { readBrainConfig } = await import('../../../src/scaffold')
      const config = readBrainConfig(brainPath)
      
      expect(config.gitSync).toBe(false)
      expect(config.extras).toEqual([])
      expect(config.obsidianDir).toBeNull()
    })
  })

  describe('full scaffold workflow', () => {
    it('should create complete brain structure with config', async () => {
      const brainPath = join(tmpHome, 'mybrain')
      
      const { createBrainFolder, writeBrainConfig, readBrainConfig } = await import('../../../src/scaffold')
      
      await createBrainFolder({ brainPath, includeObsidian: true })
      writeBrainConfig({
        brainPath,
        gitSync: true,
        extras: ['office'],
        obsidianDir: brainPath
      })
      
      expect(existsSync(join(brainPath, 'raw', 'notes'))).toBe(true)
      expect(existsSync(join(brainPath, '.obsidian'))).toBe(true)
      expect(existsSync(join(brainPath, '.brain-config.json'))).toBe(true)
      
      const config = readBrainConfig(brainPath)
      expect(config.gitSync).toBe(true)
      expect(config.obsidianDir).toBe(brainPath)
    })
  })
})
