import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, installAlwaysOn } from '@ai-brain/core/platforms/claude'

describe('platforms/claude', () => {
  describe('detect', () => {
    it('should return true when .claude dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
      mkdirSync(join(fakeHome, '.claude'), { recursive: true })

      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .claude dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))

      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should create mcp.json with ai-brain entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
      const claudeDir = join(fakeHome, '.claude')
      mkdirSync(claudeDir, { recursive: true })

      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const mcpPath = join(claudeDir, 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)
      const mcp = JSON.parse(readFileSync(mcpPath, 'utf8')) as {
        mcpServers: Record<string, { type: string; command?: string }>
      }
      expect(mcp.mcpServers['ai-brain']).toBeDefined()
      expect(mcp.mcpServers['ai-brain'].type).toBe('stdio')

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should merge with existing mcp.json entries', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
      const claudeDir = join(fakeHome, '.claude')
      mkdirSync(claudeDir, { recursive: true })
      writeFileSync(
        join(claudeDir, 'mcp.json'),
        JSON.stringify({
          mcpServers: { 'other-server': { type: 'stdio', command: 'other' } }
        }),
        'utf8'
      )

      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const mcp = JSON.parse(readFileSync(join(claudeDir, 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, { type: string; command?: string }>
      }
      expect(mcp.mcpServers['other-server']).toBeDefined()
      expect(mcp.mcpServers['ai-brain']).toBeDefined()

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should throw error on invalid JSON', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
      const claudeDir = join(fakeHome, '.claude')
      mkdirSync(claudeDir, { recursive: true })
      writeFileSync(join(claudeDir, 'mcp.json'), 'invalid json{', 'utf8')

      await expect(patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })).rejects.toThrow(
        'Could not parse'
      )

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installSkill', () => {
    it('should write brain.md to commands directory', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))

      await installSkill({ homeDir: fakeHome })

      const skillPath = join(fakeHome, '.claude', 'commands', 'brain.md')
      expect(existsSync(skillPath)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installAlwaysOn', () => {
    it('should be a no-op that resolves', async () => {
      await expect(installAlwaysOn()).resolves.toBeUndefined()
    })
  })
})
