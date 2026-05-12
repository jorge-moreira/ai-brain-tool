import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createBrain, importBrain, removeBrain } from '@ai-brain/core/brains'
import { writeConfig, ensureConfigDir } from '@ai-brain/core/config/state'
import { readConfig } from '@ai-brain/core/config/state'

describe('brains integration', () => {
  let tmpHome: string
  let originalHome: string

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'brains-integration-'))
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

  describe('createBrain', () => {
    it('should create brain folder and register it in config', async () => {
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

      const config = readConfig()
      expect(config.brains['test-brain']).toBe(result.brainPath)
    })

    it('should create brain with obsidian integration', async () => {
      const result = await createBrain({
        name: 'obsidian-brain',
        basePath: tmpHome,
        includeObsidian: true,
        obsidianDir: null,
        gitSync: false,
        useGit: false
      })

      expect(result.success).toBe(true)
      expect(result.brainPath).toBeDefined()

      if (!result.brainPath) throw new Error('brainPath is undefined')
      const obsidianDir = join(result.brainPath, '.obsidian')
      expect(existsSync(obsidianDir)).toBe(true)
    })

    it('should create brain with git initialization', async () => {
      const result = await createBrain({
        name: 'git-brain',
        basePath: tmpHome,
        includeObsidian: false,
        gitSync: true,
        useGit: true,
        gitRemote: undefined
      })

      expect(result.success).toBe(true)
      if (!result.brainPath) throw new Error('brainPath is undefined')
      expect(existsSync(join(result.brainPath, '.git'))).toBe(true)
    })

    it('should write .brain-config.json with correct settings', async () => {
      const result = await createBrain({
        name: 'config-brain',
        basePath: tmpHome,
        includeObsidian: true,
        obsidianDir: '/custom/obsidian',
        gitSync: true,
        useGit: false
      })

      expect(result.success).toBe(true)
      expect(result.brainPath).toBeDefined()

      if (!result.brainPath) throw new Error('brainPath is undefined')
      const brainConfigPath = join(result.brainPath, '.brain-config.json')
      expect(existsSync(brainConfigPath)).toBe(true)

      const brainConfig = JSON.parse(readFileSync(brainConfigPath, 'utf8')) as {
        gitSync: boolean
        obsidianDir: string | null
      }
      expect(brainConfig.gitSync).toBe(true)
      expect(brainConfig.obsidianDir).toBe('/custom/obsidian')
    })

    it('should create .graphifyignore file', async () => {
      const result = await createBrain({
        name: 'graphifyignore-brain',
        basePath: tmpHome,
        includeObsidian: false,
        gitSync: false,
        useGit: false
      })

      expect(result.success).toBe(true)
      if (!result.brainPath) throw new Error('brainPath is undefined')
      expect(existsSync(join(result.brainPath, '.graphifyignore'))).toBe(true)
    })
  })

  describe('importBrain', () => {
    it('should import an existing brain and register it', async () => {
      const brainDir = mkdtempSync(join(tmpdir(), 'import-brain-'))
      const brainName = brainDir.split('/').pop() || 'import-brain'
      mkdirSync(join(brainDir, 'raw'), { recursive: true })
      writeFileSync(join(brainDir, '.graphifyignore'), '', 'utf8')
      writeFileSync(join(brainDir, '.brain-config.json'), '{}', 'utf8')

      const result = await importBrain(brainDir)

      expect(result.success).toBe(true)
      expect(result.brainId).toBe(brainName)
      expect(result.brainPath).toBe(brainDir)

      const config = readConfig()
      expect(config.brains[brainName]).toBe(brainDir)

      rmSync(brainDir, { recursive: true, force: true })
    })

    it('should fail when importing invalid brain path', async () => {
      const invalidDir = mkdtempSync(join(tmpdir(), 'invalid-brain-'))

      const result = await importBrain(invalidDir)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()

      rmSync(invalidDir, { recursive: true, force: true })
    })
  })

  describe('removeBrain', () => {
    it('should remove brain from config', async () => {
      const brainPath = join(tmpHome, 'remove-test-brain')
      mkdirSync(brainPath, { recursive: true })
      writeConfig({
        installationComplete: true,
        graphifyyExtras: [],
        aiTools: [],
        brains: { 'remove-test-brain': brainPath }
      })

      const result = await removeBrain('remove-test-brain', false)

      expect(result.success).toBe(true)

      const config = readConfig()
      expect(config.brains['remove-test-brain']).toBeUndefined()
    })

    it('should remove brain and delete folder when requested', async () => {
      const brainPath = join(tmpHome, 'delete-test-brain')
      mkdirSync(brainPath, { recursive: true })
      writeFileSync(join(brainPath, 'test.txt'), 'test', 'utf8')
      writeConfig({
        installationComplete: true,
        graphifyyExtras: [],
        aiTools: [],
        brains: { 'delete-test-brain': brainPath }
      })

      expect(existsSync(brainPath)).toBe(true)

      const result = await removeBrain('delete-test-brain', true)

      expect(result.success).toBe(true)
      expect(existsSync(brainPath)).toBe(false)

      const config = readConfig()
      expect(config.brains['delete-test-brain']).toBeUndefined()
    })

    it('should fail when removing non-existent brain', async () => {
      const result = await removeBrain('nonexistent-brain', false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should clean up MCP config for configured AI tools', async () => {
      const brainPath = join(tmpHome, 'mcp-cleanup-brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      writeFileSync(
        join(tmpHome, '.claude', 'mcp.json'),
        JSON.stringify({
          mcpServers: {
            'ai-brain-mcp-cleanup-brain': {
              type: 'stdio',
              command: 'python',
              args: ['-m', 'graphify.serve']
            },
            'other-server': {
              type: 'stdio',
              command: 'other'
            }
          }
        }),
        'utf8'
      )

      writeConfig({
        installationComplete: true,
        graphifyyExtras: [],
        aiTools: ['claude'],
        brains: { 'mcp-cleanup-brain': brainPath }
      })

      const result = await removeBrain('mcp-cleanup-brain', false)

      expect(result.success).toBe(true)

      const mcpConfig = JSON.parse(readFileSync(join(tmpHome, '.claude', 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, unknown>
      }
      expect(mcpConfig.mcpServers['ai-brain-mcp-cleanup-brain']).toBeUndefined()
      expect(mcpConfig.mcpServers['other-server']).toBeDefined()
    })

    it('should call unpatch for each configured AI tool when removing brain', async () => {
      const brainPath = join(tmpHome, 'unpatch-test-brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(brainPath, 'raw'), { recursive: true })
      writeFileSync(join(brainPath, '.graphifyignore'), '', 'utf8')
      writeFileSync(join(brainPath, '.brain-config.json'), '{}', 'utf8')

      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      writeFileSync(
        join(tmpHome, '.claude', 'mcp.json'),
        JSON.stringify({
          mcpServers: {
            'ai-brain-unpatch-test-brain': {
              type: 'stdio',
              command: 'python',
              args: ['-m', 'graphify.serve']
            }
          }
        }),
        'utf8'
      )

      const initialMcpConfig = JSON.parse(
        readFileSync(join(tmpHome, '.claude', 'mcp.json'), 'utf8')
      ) as {
        mcpServers: Record<string, unknown>
      }
      expect(initialMcpConfig.mcpServers['ai-brain-unpatch-test-brain']).toBeDefined()

      writeConfig({
        installationComplete: true,
        graphifyyExtras: [],
        aiTools: ['claude'],
        brains: { 'unpatch-test-brain': brainPath }
      })

      expect(existsSync(brainPath)).toBe(true)

      const result = await removeBrain('unpatch-test-brain', true)

      expect(result.success).toBe(true)
      expect(existsSync(brainPath)).toBe(false)

      const config = readConfig()
      expect(config.brains['unpatch-test-brain']).toBeUndefined()

      const finalMcpConfig = JSON.parse(
        readFileSync(join(tmpHome, '.claude', 'mcp.json'), 'utf8')
      ) as {
        mcpServers: Record<string, unknown>
      }
      expect(finalMcpConfig.mcpServers['ai-brain-unpatch-test-brain']).toBeUndefined()
    })
  })
})
