import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detect, patch, installSkill, unpatch } from '@ai-brain/core/platforms/opencode'
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

      await patch({ brainPath: '/tmp/my-brain', brainId: 'test-brain', homeDir: fakeHome })

      const configPath = join(fakeHome, '.config', 'opencode', 'opencode.json')
      expect(existsSync(configPath)).toBe(true)
      const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
        mcp: Record<string, { type: string }>
      }
      expect(config.mcp['ai-brain-test-brain']).toBeDefined()
      expect(config.mcp['ai-brain-test-brain'].type).toBe('local')

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

  describe('unpatch', () => {
    it('should remove ai-brain from opencode.json', async () => {
      const fakeHome = mkdtempSync(join(tmpdir(), 'opencode-test-'))
      const configDir = join(fakeHome, '.config', 'opencode')
      const configPath = join(configDir, 'opencode.json')

      mkdirSync(configDir, { recursive: true })
      writeFileSync(
        configPath,
        JSON.stringify({
          mcp: {
            'ai-brain-test': { type: 'local', command: ['python', '-m', 'graphify'] },
            other: { type: 'local', command: ['other'] }
          }
        }),
        'utf8'
      )

      await unpatch({ brainId: 'test', homeDir: fakeHome })

      const content = JSON.parse(readFileSync(configPath, 'utf8')) as {
        mcp: Record<string, unknown>
      }
      expect(content.mcp['ai-brain-test']).toBeUndefined()
      expect(content.mcp.other).toBeDefined()

      rmSync(fakeHome, { recursive: true, force: true })
    })
  })
})
