import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, installAlwaysOn } from '../../../src/platforms/opencode'

describe('platforms/opencode', () => {
  describe('detect', () => {
    it('should return true when .config/opencode dir exists', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'opencode-test-'))
      mkdirSync(join(fakeHome, '.config', 'opencode'), { recursive: true })

      expect(detect(fakeHome)).toBe(true)

      rmSync(fakeHome, { recursive: true, force: true })
    })

    it('should return false when .config/opencode dir does not exist', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'opencode-test-'))

      expect(detect(fakeHome)).toBe(false)

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('patch', () => {
    it('should create opencode.json with ai-brain mcp entry', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'opencode-test-'))

      await patch({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

      const configPath = join(fakeHome, '.config', 'opencode', 'opencode.json')
      expect(existsSync(configPath)).toBe(true)
      const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
        mcp: Record<string, { type: string }>
      }
      expect(config.mcp['ai-brain']).toBeDefined()
      expect(config.mcp['ai-brain'].type).toBe('local')

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })

  describe('installSkill', () => {
    it('should write SKILL.md to skills/brain directory', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'opencode-test-'))

      await installSkill({ homeDir: fakeHome })

      const skillPath = join(fakeHome, '.config', 'opencode', 'skills', 'brain', 'SKILL.md')
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
