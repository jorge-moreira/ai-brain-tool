import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, installAlwaysOn } from '@ai-brain/core/platforms/copilot'

describe('platforms/copilot', () => {
  describe('detect', () => {
    it('should return true when .config/gh dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))
      mkdirSync(join(fakeHome, '.config', 'gh'), { recursive: true })

      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .config/gh dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))

      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should be a no-op (copilot CLI does not use JSON config)', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'copilot-test-'))

      await expect(
        patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })
      ).resolves.toBeUndefined()

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
  })

  describe('installAlwaysOn', () => {
    it('should be a no-op that resolves', async () => {
      await expect(installAlwaysOn()).resolves.toBeUndefined()
    })
  })
})
