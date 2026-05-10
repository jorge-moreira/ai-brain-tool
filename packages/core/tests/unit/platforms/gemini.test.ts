import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, installAlwaysOn } from '@ai-brain/core/platforms/gemini'

describe('platforms/gemini', () => {
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

      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const settingsPath = join(fakeHome, '.gemini', 'settings.json')
      expect(existsSync(settingsPath)).toBe(true)
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8')) as {
        mcpServers: Record<string, { type?: string }>
      }
      expect(settings.mcpServers['ai-brain']).toBeDefined()

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

  describe('installAlwaysOn', () => {
    it('should be a no-op that resolves', async () => {
      await expect(installAlwaysOn()).resolves.toBeUndefined()
    })
  })
})
