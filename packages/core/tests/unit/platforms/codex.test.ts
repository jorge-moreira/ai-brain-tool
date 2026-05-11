import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, unpatch } from '@ai-brain/core/platforms/codex'
describe('platforms/codex', () => {
  describe('detect', () => {
    it('should return true when .codex dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'codex-test-'))
      mkdirSync(join(fakeHome, '.codex'), { recursive: true })

      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .codex dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'codex-test-'))

      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should create config.toml with ai-brain mcp entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'codex-test-'))

      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const configPath = join(fakeHome, '.codex', 'config.toml')
      expect(existsSync(configPath)).toBe(true)
      const content = readFileSync(configPath, 'utf8')
      expect(content.includes('[mcp_servers.ai-brain]')).toBe(true)
      expect(content.includes('python3')).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should replace existing ai-brain block when run twice', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'codex-test-'))

      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })
      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const configPath = join(fakeHome, '.codex', 'config.toml')
      const content = readFileSync(configPath, 'utf8')
      const blockCount = (content.match(/\[mcp_servers\.ai-brain\]/g) || []).length
      expect(blockCount).toBe(1)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installSkill', () => {
    it('should write SKILL.md to skills/brain directory', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'codex-test-'))

      await installSkill({ homeDir: fakeHome })

      const skillPath = join(fakeHome, '.codex', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('unpatch', () => {
    it('should remove ai-brain from mcp.json', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'codex-test-'))
      const codexDir = join(fakeHome, '.codex')
      const mcpPath = join(codexDir, 'mcp.json')

      mkdirSync(codexDir, { recursive: true })
      writeFileSync(
        mcpPath,
        JSON.stringify({
          mcpServers: {
            'ai-brain-test': { command: 'python', args: ['-m', 'graphify'] },
            other: { command: 'other' }
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
