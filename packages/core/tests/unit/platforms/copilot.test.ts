import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, unpatch } from '@ai-brain/core/platforms/copilot'

vi.mock('@ai-brain/core/graphify', () => ({
  globalVenvPythonPath: vi.fn(() => '/mock/global-venv/bin/python3')
}))

describe('platforms/copilot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('detect', () => {
    it('should return true when .copilot dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))
      mkdirSync(join(fakeHome, '.copilot'), { recursive: true })

      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .copilot dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))

      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should create mcp-config.json with ai-brain server entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))

      await patch({ brainPath: '/tmp/my-brain', brainId: 'test-brain', homeDir: fakeHome })

      const configPath = join(fakeHome, '.copilot', 'mcp-config.json')
      expect(existsSync(configPath)).toBe(true)

      const content = JSON.parse(readFileSync(configPath, 'utf8')) as {
        mcpServers: Record<string, unknown>
      }
      expect(content.mcpServers['ai-brain-test-brain']).toBeDefined()
      expect(content.mcpServers['ai-brain-test-brain'].command).toBe(
        '/mock/global-venv/bin/python3'
      )

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should replace existing ai-brain block when run twice', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))

      await patch({ brainPath: '/tmp/my-brain', brainId: 'test-brain', homeDir: fakeHome })
      await patch({ brainPath: '/tmp/my-brain', brainId: 'test-brain', homeDir: fakeHome })

      const configPath = join(fakeHome, '.copilot', 'mcp-config.json')
      const content = JSON.parse(readFileSync(configPath, 'utf8')) as {
        mcpServers: Record<string, unknown>
      }
      const entryCount = Object.keys(content.mcpServers).filter(k =>
        k.startsWith('ai-brain-')
      ).length
      expect(entryCount).toBe(1)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installSkill', () => {
    it('should write SKILL.md to skills/brain directory', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))

      await installSkill({ homeDir: fakeHome })

      const skillPath = join(fakeHome, '.copilot', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should include YAML frontmatter with name, description and trigger', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))

      await installSkill({ homeDir: fakeHome })

      const content = readFileSync(
        join(fakeHome, '.copilot', 'skills', 'brain', 'SKILL.md'),
        'utf8'
      )
      expect(content).toMatch(/^---/)
      expect(content).toContain('name: brain')
      expect(content).toContain('trigger: /brain')

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('unpatch', () => {
    it('should remove ai-brain from mcp-config.json', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))
      const copilotDir = join(fakeHome, '.copilot')
      const mcpPath = join(copilotDir, 'mcp-config.json')

      mkdirSync(copilotDir, { recursive: true })
      writeFileSync(
        mcpPath,
        JSON.stringify({
          mcpServers: {
            'ai-brain-test': {
              type: 'local',
              command: 'python',
              args: ['-m', 'graphify'],
              env: {},
              tools: ['*']
            },
            other: { type: 'local', command: 'other', args: [], env: {}, tools: ['*'] }
          }
        }),
        'utf8'
      )

      await unpatch({ brainId: 'test', homeDir: fakeHome })

      const content = JSON.parse(readFileSync(mcpPath, 'utf8')) as {
        mcpServers: Record<string, unknown>
      }
      expect(content.mcpServers['ai-brain-test']).toBeUndefined()
      expect(content.mcpServers.other).toBeDefined()

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })
})
