import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createBrain, removeBrain, isExistingBrain, importBrain } from '@ai-brain/core/brains'
import { writeConfig, ensureConfigDir } from '@ai-brain/core/config/state'
import { addBrain } from '@ai-brain/core/config/brains'

describe('brains', () => {
  let tmpHome: string
  let originalHome: string

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'brains-test-'))
    originalHome = process.env.HOME || ''
    process.env.HOME = tmpHome
    ensureConfigDir()
    writeConfig({
      installationComplete: true,
      graphifyyExtras: [],
      aiTools: [],
      brains: {}
    })
  })

  afterEach(() => {
    if (originalHome) {
      process.env.HOME = originalHome
    } else {
      delete process.env.HOME
    }
    rmSync(tmpHome, { recursive: true, force: true })
  })

  describe('isExistingBrain', () => {
    it('should return true when all brain markers exist', () => {
      const brainDir = mkdtempSync(join(tmpdir(), 'brain-'))
      mkdirSync(join(brainDir, 'raw'), { recursive: true })
      writeFileSync(join(brainDir, '.graphifyignore'), '', 'utf8')
      writeFileSync(join(brainDir, '.brain-config.json'), '{}', 'utf8')

      expect(isExistingBrain(brainDir)).toBe(true)

      rmSync(brainDir, { recursive: true, force: true })
    })

    it('should return false when markers are missing', () => {
      const brainDir = mkdtempSync(join(tmpdir(), 'brain-'))
      mkdirSync(join(brainDir, 'raw'), { recursive: true })

      expect(isExistingBrain(brainDir)).toBe(false)

      rmSync(brainDir, { recursive: true, force: true })
    })

    it('should return false when directory does not exist', () => {
      expect(isExistingBrain('/nonexistent/path')).toBe(false)
    })
  })

  describe('createBrain', () => {
    it('should create a brain with basic options', async () => {
      const result = await createBrain({
        name: 'test-brain',
        basePath: tmpHome,
        includeObsidian: false,
        gitSync: false,
        useGit: false
      })

      expect(result.success).toBe(true)
      expect(result.brainId).toBe('test-brain')
      expect(result.brainPath).toBeDefined()
    })

    it('should create a brain with obsidian integration', async () => {
      const result = await createBrain({
        name: 'obsidian-brain',
        basePath: tmpHome,
        includeObsidian: true,
        obsidianDir: null,
        gitSync: false,
        useGit: false
      })

      expect(result.success).toBe(true)
      expect(result.brainId).toBe('obsidian-brain')
    })

    it('should create a brain with custom obsidian directory', async () => {
      const customObsidianDir = join(tmpHome, 'custom-obsidian')
      mkdirSync(customObsidianDir, { recursive: true })

      const result = await createBrain({
        name: 'custom-obsidian-brain',
        basePath: tmpHome,
        includeObsidian: true,
        obsidianDir: customObsidianDir,
        gitSync: false,
        useGit: false
      })

      expect(result.success).toBe(true)
      expect(result.brainId).toBe('custom-obsidian-brain')
    })

    it('should create a brain with git enabled', async () => {
      const result = await createBrain({
        name: 'git-brain',
        basePath: tmpHome,
        includeObsidian: false,
        gitSync: true,
        useGit: true,
        gitRemote: undefined
      })

      expect(result.success).toBe(true)
      expect(result.brainId).toBe('git-brain')
    })

    it('should handle empty obsidianDir as brain path when includeObsidian is true', async () => {
      const result = await createBrain({
        name: 'empty-obsidian-brain',
        basePath: tmpHome,
        includeObsidian: true,
        obsidianDir: '',
        gitSync: false,
        useGit: false
      })

      expect(result.success).toBe(true)
      expect(result.brainId).toBe('empty-obsidian-brain')
    })
  })

  describe('removeBrain', () => {
    it('should remove a brain from config', async () => {
      const brainPath = join(tmpHome, 'test-brain')
      mkdirSync(brainPath, { recursive: true })
      addBrain('test-brain', brainPath)

      const result = await removeBrain('test-brain', false)

      expect(result.success).toBe(true)
    })

    it('should remove a brain and delete the folder', async () => {
      const brainPath = join(tmpHome, 'delete-brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, 'test.txt'), 'test', 'utf8')
      addBrain('delete-brain', brainPath)

      expect(existsSync(brainPath)).toBe(true)

      const result = await removeBrain('delete-brain', true)

      expect(result.success).toBe(true)
      expect(existsSync(brainPath)).toBe(false)
    })

    it('should return failure when brain does not exist', async () => {
      const result = await removeBrain('nonexistent-brain', false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should clean up MCP config for configured AI tools', async () => {
      const brainPath = join(tmpHome, 'mcp-brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      writeFileSync(
        join(tmpHome, '.claude', 'mcp.json'),
        JSON.stringify({
          mcpServers: {
            'ai-brain-mcp-brain': {
              type: 'stdio',
              command: 'python',
              args: ['-m', 'graphify.serve']
            }
          }
        }),
        'utf8'
      )

      addBrain('mcp-brain', brainPath)
      writeConfig({
        installationComplete: true,
        graphifyyExtras: [],
        aiTools: ['claude'],
        brains: { 'mcp-brain': brainPath }
      })

      const result = await removeBrain('mcp-brain', false)

      expect(result.success).toBe(true)

      const mcpConfig = JSON.parse(readFileSync(join(tmpHome, '.claude', 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, unknown>
      }
      expect(mcpConfig.mcpServers['ai-brain-mcp-brain']).toBeUndefined()
    })
  })

  describe('importBrain', () => {
    it('should import an existing brain', async () => {
      const brainDir = mkdtempSync(join(tmpdir(), 'import-brain-'))
      const brainName = brainDir.split('/').pop() || 'import-brain'
      mkdirSync(join(brainDir, 'raw'), { recursive: true })
      writeFileSync(join(brainDir, '.graphifyignore'), '', 'utf8')
      writeFileSync(join(brainDir, '.brain-config.json'), '{}', 'utf8')

      const result = await importBrain(brainDir)

      expect(result.success).toBe(true)
      expect(result.brainId).toBe(brainName)
      expect(result.brainPath).toBe(brainDir)

      rmSync(brainDir, { recursive: true, force: true })
    })

    it('should return failure when path is not a valid brain', async () => {
      const invalidDir = mkdtempSync(join(tmpdir(), 'invalid-brain-'))

      const result = await importBrain(invalidDir)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not a valid brain')

      rmSync(invalidDir, { recursive: true, force: true })
    })

    it('should configure MCP for configured AI tools', async () => {
      const brainDir = mkdtempSync(join(tmpdir(), 'mcp-import-brain-'))
      const brainName = brainDir.split('/').pop() || 'mcp-import-brain'
      mkdirSync(join(brainDir, 'raw'), { recursive: true })
      writeFileSync(join(brainDir, '.graphifyignore'), '', 'utf8')
      writeFileSync(join(brainDir, '.brain-config.json'), '{}', 'utf8')
      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      writeFileSync(join(tmpHome, '.claude', 'mcp.json'), '{}', 'utf8')

      writeConfig({
        installationComplete: true,
        graphifyyExtras: [],
        aiTools: ['claude'],
        brains: {}
      })

      const result = await importBrain(brainDir)

      expect(result.success).toBe(true)

      const mcpConfig = JSON.parse(readFileSync(join(tmpHome, '.claude', 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, unknown>
      }
      expect(mcpConfig.mcpServers[`ai-brain-${brainName}`]).toBeDefined()

      rmSync(brainDir, { recursive: true, force: true })
    })
  })
})
