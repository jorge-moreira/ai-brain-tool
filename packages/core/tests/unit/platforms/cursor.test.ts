import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, unpatch } from '@ai-brain/core/platforms/cursor'
describe('platforms/cursor', () => {
  describe('detect', () => {
    it('should return true when .cursor dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))
      mkdirSync(join(fakeHome, '.cursor'), { recursive: true })

      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .cursor dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))

      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should create mcp.json with ai-brain entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))

      await patch({ brainPath: '/tmp/my-brain', brainId: 'test-brain', homeDir: fakeHome })

      const mcpPath = join(fakeHome, '.cursor', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)
      const mcp = JSON.parse(readFileSync(mcpPath, 'utf8')) as {
        mcpServers: Record<string, { type?: string }>
      }
      expect(mcp.mcpServers['ai-brain-test-brain']).toBeDefined()

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installSkill', () => {
    it('should write brain.mdc to rules directory', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))

      await installSkill({ homeDir: fakeHome })

      const skillPath = join(fakeHome, '.cursor', 'rules', 'brain.mdc')
      expect(existsSync(skillPath)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('unpatch', () => {
    it('should remove ai-brain from mcp.json', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))
      const cursorDir = join(fakeHome, '.cursor')
      const mcpPath = join(cursorDir, 'mcp.json')

      mkdirSync(cursorDir, { recursive: true })
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
