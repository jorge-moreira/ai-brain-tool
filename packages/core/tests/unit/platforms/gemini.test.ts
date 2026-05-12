import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, unpatch } from '@ai-brain/core/platforms/gemini'

vi.mock('@ai-brain/core/graphify', () => ({
  globalVenvPythonPath: vi.fn(() => '/mock/global-venv/bin/python3')
}))

describe('platforms/gemini', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('detect', () => {
    it('should return true when .gemini dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'gemini-test-'))
      mkdirSync(join(fakeHome, '.gemini'), { recursive: true })

      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .gemini dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'gemini-test-'))

      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should create settings.json with ai-brain mcp entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'gemini-test-'))

      await patch({ brainPath: '/tmp/my-brain', brainId: 'test-brain', homeDir: fakeHome })

      const settingsPath = join(fakeHome, '.gemini', 'settings.json')
      expect(existsSync(settingsPath)).toBe(true)
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8')) as {
        mcpServers: Record<string, { type?: string }>
      }
      expect(settings.mcpServers['ai-brain-test-brain']).toBeDefined()
      expect(settings.mcpServers['ai-brain-test-brain'].command).toBe(
        '/mock/global-venv/bin/python3'
      )

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installSkill', () => {
    it('should write SKILL.md to skills/brain directory', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'gemini-test-'))

      await installSkill({ homeDir: fakeHome })

      const skillPath = join(fakeHome, '.gemini', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('unpatch', () => {
    it('should remove ai-brain from settings.json', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'gemini-test-'))
      const geminiDir = join(fakeHome, '.gemini')
      const settingsPath = join(geminiDir, 'settings.json')

      mkdirSync(geminiDir, { recursive: true })
      writeFileSync(
        settingsPath,
        JSON.stringify({
          mcpServers: {
            'ai-brain-test': { command: 'python', args: ['-m', 'graphify'] },
            other: { command: 'other' }
          }
        }),
        'utf8'
      )

      await unpatch({ brainId: 'test', homeDir: fakeHome })

      const content = JSON.parse(readFileSync(settingsPath, 'utf8')) as {
        mcpServers: Record<string, unknown>
      }
      expect(content.mcpServers['ai-brain-test']).toBeUndefined()
      expect(content.mcpServers.other).toBeDefined()

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })
})
