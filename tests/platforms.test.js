import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('platforms', () => {
  describe('detectAll', () => {
    it('should return an array of platform objects with name and detected properties', async () => {
      const { detectAll } = await import('../src/platforms/index.js')
      const results = await detectAll()
      expect(Array.isArray(results)).toBe(true)
      expect(results.every(r => typeof r.name === 'string')).toBe(true)
      expect(results.every(r => typeof r.detected === 'boolean')).toBe(true)
    })
  })

  describe('claude patch', () => {
    it('should create mcp.json with ai-brain entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
      const claudeDir = join(fakeHome, '.claude')
      mkdirSync(claudeDir, { recursive: true })
      afterEach(() => rmSync(fakeHome, { recursive: true, force: true }))

      const { patch } = await import('../src/platforms/claude.js')
      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const mcpPath = join(claudeDir, 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)
      const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
      expect(mcp.mcpServers['ai-brain']).toBeDefined()
      expect(mcp.mcpServers['ai-brain'].type).toBe('stdio')
    })

    it('should merge with existing mcp.json entries', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
      const claudeDir = join(fakeHome, '.claude')
      mkdirSync(claudeDir, { recursive: true })
      writeFileSync(join(claudeDir, 'mcp.json'), JSON.stringify({
        mcpServers: { 'other-server': { type: 'stdio', command: 'other' } }
      }), 'utf8')
      afterEach(() => rmSync(fakeHome, { recursive: true, force: true }))

      const { patch } = await import('../src/platforms/claude.js')
      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const mcp = JSON.parse(readFileSync(join(claudeDir, 'mcp.json'), 'utf8'))
      expect(mcp.mcpServers['other-server']).toBeDefined()
      expect(mcp.mcpServers['ai-brain']).toBeDefined()
    })

    it('should not duplicate entries when run twice', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
      const claudeDir = join(fakeHome, '.claude')
      mkdirSync(claudeDir, { recursive: true })
      afterEach(() => rmSync(fakeHome, { recursive: true, force: true }))

      const { patch } = await import('../src/platforms/claude.js')
      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })
      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const mcp = JSON.parse(readFileSync(join(claudeDir, 'mcp.json'), 'utf8'))
      const aiBrainCount = Object.keys(mcp.mcpServers).filter(k => k === 'ai-brain').length
      expect(aiBrainCount).toBe(1)
    })
  })

  describe('claude installAlwaysOn', () => {
    it('should write CLAUDE.md with ai-brain section', async () => {
      const brainPath = mkdtempSync(join(tmpdir(), 'brain-always-on-'))
      afterEach(() => rmSync(brainPath, { recursive: true, force: true }))

      const { installAlwaysOn } = await import('../src/platforms/claude.js')
      await installAlwaysOn({ brainPath })

      const claudeMd = join(brainPath, 'CLAUDE.md')
      expect(existsSync(claudeMd)).toBe(true)
      const content = readFileSync(claudeMd, 'utf8')
      expect(content.includes('## ai-brain')).toBe(true)
    })

    it('should not duplicate section when run twice', async () => {
      const brainPath = mkdtempSync(join(tmpdir(), 'brain-always-on-'))
      afterEach(() => rmSync(brainPath, { recursive: true, force: true }))

      const { installAlwaysOn } = await import('../src/platforms/claude.js')
      await installAlwaysOn({ brainPath })
      await installAlwaysOn({ brainPath })

      const content = readFileSync(join(brainPath, 'CLAUDE.md'), 'utf8')
      expect(content.split('## ai-brain').length - 1).toBe(1)
    })
  })

  describe('opencode installAlwaysOn', () => {
    it('should write AGENTS.md with ai-brain section', async () => {
      const brainPath = mkdtempSync(join(tmpdir(), 'brain-always-on-'))
      afterEach(() => rmSync(brainPath, { recursive: true, force: true }))

      const { installAlwaysOn } = await import('../src/platforms/opencode.js')
      await installAlwaysOn({ brainPath })

      const agentsMd = join(brainPath, 'AGENTS.md')
      expect(existsSync(agentsMd)).toBe(true)
      const content = readFileSync(agentsMd, 'utf8')
      expect(content.includes('## ai-brain')).toBe(true)
    })
  })
})