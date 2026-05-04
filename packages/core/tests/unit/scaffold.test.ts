import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('scaffold', () => {
  describe('createBrainFolder', () => {
    it('should create all required directories', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-folder-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { createBrainFolder } = await import('../../src/scaffold')
      await createBrainFolder({ brainPath: tmp, includeObsidian: false })

      expect(existsSync(join(tmp, 'raw', 'notes'))).toBe(true)
      expect(existsSync(join(tmp, 'raw', 'articles'))).toBe(true)
      expect(existsSync(join(tmp, 'raw', 'projects'))).toBe(true)
      expect(existsSync(join(tmp, 'raw', 'documentation'))).toBe(true)
      expect(existsSync(join(tmp, 'raw', 'templates', 'markdown', '_bundled'))).toBe(true)
      expect(existsSync(join(tmp, 'raw', 'templates', 'markdown', '_custom'))).toBe(true)
      expect(existsSync(join(tmp, 'raw', 'templates', 'web-clipper', '_bundled'))).toBe(true)
      expect(existsSync(join(tmp, 'raw', 'templates', 'web-clipper', '_custom'))).toBe(true)
      expect(existsSync(join(tmp, 'graphify-out'))).toBe(true)
    })

    it('should write .graphifyignore file', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-folder-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { createBrainFolder } = await import('../../src/scaffold')
      await createBrainFolder({ brainPath: tmp, includeObsidian: false })

      expect(existsSync(join(tmp, '.graphifyignore'))).toBe(true)
    })

    it('should create .obsidian folder when includeObsidian is true', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-folder-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { createBrainFolder } = await import('../../src/scaffold')
      await createBrainFolder({ brainPath: tmp, includeObsidian: true })

      expect(existsSync(join(tmp, '.obsidian'))).toBe(true)
    })

    it('should not create .obsidian folder when includeObsidian is false', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-folder-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { createBrainFolder } = await import('../../src/scaffold')
      await createBrainFolder({ brainPath: tmp, includeObsidian: false })

      expect(existsSync(join(tmp, '.obsidian'))).toBe(false)
    })
  })

  describe('writeBrainConfig', () => {
    it('should write .brain-config.json with gitSync flag set to true', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { writeBrainConfig } = await import('../../src/scaffold')
      writeBrainConfig({ brainPath: tmp, gitSync: true })

      const cfg = JSON.parse(readFileSync(join(tmp, '.brain-config.json'), 'utf8')) as {
        gitSync: boolean
        obsidianDir?: string
      }
      expect(cfg.gitSync).toBe(true)
    })

    it('should store gitSync=false correctly', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { writeBrainConfig } = await import('../../src/scaffold')
      writeBrainConfig({ brainPath: tmp, gitSync: false })

      const cfg = JSON.parse(readFileSync(join(tmp, '.brain-config.json'), 'utf8')) as {
        gitSync: boolean
        obsidianDir?: string
      }
      expect(cfg.gitSync).toBe(false)
    })

    it('should include obsidianDir when provided', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { writeBrainConfig } = await import('../../src/scaffold')
      writeBrainConfig({ brainPath: tmp, gitSync: false, obsidianDir: '/path/to/vault' })

      const cfg = JSON.parse(readFileSync(join(tmp, '.brain-config.json'), 'utf8')) as {
        gitSync: boolean
        obsidianDir?: string
      }
      expect(cfg.obsidianDir).toBe('/path/to/vault')
    })
  })

  describe('readBrainConfig', () => {
    it('should return gitSync and obsidianDir from .brain-config.json', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { writeBrainConfig } = await import('../../src/scaffold')
      const { readBrainConfig } = await import('../../src/config')
      writeBrainConfig({ brainPath: tmp, gitSync: true, obsidianDir: '/path/to/vault' })

      const cfg = readBrainConfig(tmp)
      expect(cfg.gitSync).toBe(true)
      expect(cfg.obsidianDir).toBe('/path/to/vault')
    })

    it('should return defaults when no config file exists', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { readBrainConfig } = await import('../../src/config')
      const cfg = readBrainConfig(tmp)
      expect(cfg.gitSync).toBe(false)
      expect(cfg.obsidianDir).toBeNull()
    })
  })

  describe('readLocalBrainConfig', () => {
    it('should return gitSync and obsidianDir from .brain-config.json', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { writeBrainConfig, readLocalBrainConfig } = await import('../../src/scaffold')
      writeBrainConfig({ brainPath: tmp, gitSync: true, obsidianDir: '/path/to/vault' })

      const cfg = readLocalBrainConfig(tmp)
      expect(cfg.gitSync).toBe(true)
      expect(cfg.obsidianDir).toBe('/path/to/vault')
    })

    it('should return defaults when no config file exists', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { readLocalBrainConfig } = await import('../../src/scaffold')
      const cfg = readLocalBrainConfig(tmp)
      expect(cfg.gitSync).toBe(false)
      expect(cfg.obsidianDir).toBeNull()
    })
  })
})
