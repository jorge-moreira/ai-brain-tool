import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('scaffold', () => {
  describe('createBrainFolder', () => {
    it('should create expected directory structure', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))
      const brainPath = join(tmp, 'my-brain')

      const { createBrainFolder } = await import('../../src/scaffold')
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
      expect(existsSync(join(brainPath, '.graphifyignore'))).toBe(true)
    })

    it('should copy bundled markdown templates to _bundled/', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))
      const brainPath = join(tmp, 'my-brain')

      const { createBrainFolder } = await import('../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: false })

      const bundled = readdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'))
      expect(bundled).toContain('book-template.md')
      expect(bundled).toContain('meeting-template.md')
    })

    it('should create .obsidian/ when includeObsidian is true', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))
      const brainPath = join(tmp, 'my-brain')

      const { createBrainFolder } = await import('../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: true })

      expect(existsSync(join(brainPath, '.obsidian', 'templates.json'))).toBe(true)
      expect(existsSync(join(brainPath, '.obsidian', 'app.json'))).toBe(true)
    })

    it('should not create .obsidian/ when includeObsidian is false', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))
      const brainPath = join(tmp, 'my-brain')

      const { createBrainFolder } = await import('../../src/scaffold')
      await createBrainFolder({ brainPath, includeObsidian: false })

      expect(existsSync(join(brainPath, '.obsidian'))).toBe(false)
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
        extras?: string[]
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
        extras?: string[]
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
        extras?: string[]
      }
      expect(cfg.obsidianDir).toBe('/path/to/vault')
    })

    it('should include extras when provided', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { writeBrainConfig } = await import('../../src/scaffold')
      writeBrainConfig({ brainPath: tmp, gitSync: false, extras: ['office', 'pdf'] })

      const cfg = JSON.parse(readFileSync(join(tmp, '.brain-config.json'), 'utf8')) as {
        gitSync: boolean
        obsidianDir?: string
        extras?: string[]
      }
      expect(cfg.extras).toEqual(['office', 'pdf'])
    })
  })

  describe('readBrainConfig', () => {
    it('should return gitSync and extras from .brain-config.json', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { writeBrainConfig } = await import('../../src/scaffold')
      const { readBrainConfig } = await import('../../src/config')
      writeBrainConfig({ brainPath: tmp, gitSync: true, extras: ['mcp', 'pdf'] })

      const cfg = readBrainConfig(tmp)
      expect(cfg.gitSync).toBe(true)
      expect(cfg.extras).toEqual(['mcp', 'pdf'])
    })

    it('should return defaults when no config file exists', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'brain-config-test-'))
      afterEach(() => rmSync(tmp, { recursive: true, force: true }))

      const { readBrainConfig } = await import('../../src/config')
      const cfg = readBrainConfig(tmp)
      expect(cfg.gitSync).toBe(false)
      expect(cfg.extras).toEqual([])
    })
  })
})
