import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('platforms/cursor', () => {
  describe('detect', () => {
    it('should return true when .cursor dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))
      mkdirSync(join(fakeHome, '.cursor'), { recursive: true })

      const { detect } = await import('../../../src/platforms/cursor')
      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .cursor dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))

      const { detect } = await import('../../../src/platforms/cursor')
      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should create mcp.json with ai-brain entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))

      const { patch } = await import('../../../src/platforms/cursor')
      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const mcpPath = join(fakeHome, '.cursor', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)
      const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
      expect(mcp.mcpServers['ai-brain']).toBeDefined()

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installSkill', () => {
    it('should write brain.mdc to rules directory', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'cursor-test-'))

      const { installSkill } = await import('../../../src/platforms/cursor')
      await installSkill({ homeDir: fakeHome })

      const skillPath = join(fakeHome, '.cursor', 'rules', 'brain.mdc')
      expect(existsSync(skillPath)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })
})
