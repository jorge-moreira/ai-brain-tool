import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectAll,
  installSkills,
  createBrainMCP,
  type DetectedPlatform
} from '@ai-brain/core/platforms/index'

vi.mock('execa', () => ({
  execa: vi.fn()
}))

describe('platforms/index', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('detectAll', () => {
    it('should return an array of platform objects with name, key, and detected properties', async () => {
      const results = await detectAll()

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      results.forEach(r => {
        expect(typeof r.name).toBe('string')
        expect(typeof r.key).toBe('string')
        expect(typeof r.detected).toBe('boolean')
      })
    })

    it('should use provided homeDir for detection', async () => {
      const customHomeDir = '/custom/home'
      const results = await detectAll(customHomeDir)

      expect(Array.isArray(results)).toBe(true)
      results.forEach(r => {
        expect(typeof r.name).toBe('string')
        expect(typeof r.key).toBe('string')
        expect(typeof r.detected).toBe('boolean')
      })
    })

    it('should include all expected platforms', async () => {
      const results = await detectAll()
      const platformKeys = results.map(r => r.key)

      expect(platformKeys).toContain('claude')
      expect(platformKeys).toContain('opencode')
      expect(platformKeys).toContain('cursor')
      expect(platformKeys).toContain('gemini')
      expect(platformKeys).toContain('copilot')
      expect(platformKeys).toContain('codex')
    })
  })

  describe('installSkills', () => {
    it('should install skills for selected platforms', async () => {
      const mockPlatform: DetectedPlatform = {
        name: 'Mock Platform',
        key: 'mock',
        detected: true,
        configHint: '~/.mock',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }

      await installSkills({ selected: [mockPlatform], homeDir: '/tmp/home' })

      expect(mockPlatform.module.installSkill).toHaveBeenCalledWith({ homeDir: '/tmp/home' })
      expect(mockPlatform.module.installSkill).toHaveBeenCalledTimes(1)
    })

    it('should install skills for multiple platforms', async () => {
      const platform1: DetectedPlatform = {
        name: 'Mock Platform 1',
        key: 'mock1',
        detected: true,
        configHint: '~/.mock1',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }
      const platform2: DetectedPlatform = {
        name: 'Mock Platform 2',
        key: 'mock2',
        detected: true,
        configHint: '~/.mock2',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }

      await installSkills({ selected: [platform1, platform2], homeDir: '/tmp/home' })

      expect(platform1.module.installSkill).toHaveBeenCalled()
      expect(platform2.module.installSkill).toHaveBeenCalled()
    })

    it('should use default homeDir when not provided', async () => {
      const mockPlatform: DetectedPlatform = {
        name: 'Mock Platform',
        key: 'mock',
        detected: true,
        configHint: '~/.mock',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }

      await installSkills({ selected: [mockPlatform] })

      expect(mockPlatform.module.installSkill).toHaveBeenCalled()
    })

    it('should handle empty selected array', async () => {
      await expect(installSkills({ selected: [] })).resolves.toBeUndefined()
    })
  })

  describe('createBrainMCP', () => {
    it('should patch MCP config for configured platforms', async () => {
      const mockPlatform: DetectedPlatform = {
        name: 'Mock Platform',
        key: 'mock',
        detected: true,
        configHint: '~/.mock',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }

      await createBrainMCP({
        configuredPlatforms: [mockPlatform],
        brainPath: '/tmp/brain',
        brainId: 'test-brain',
        homeDir: '/tmp/home'
      })

      expect(mockPlatform.module.patch).toHaveBeenCalledWith({
        brainPath: '/tmp/brain',
        brainId: 'test-brain',
        homeDir: '/tmp/home'
      })
      expect(mockPlatform.module.installSkill).not.toHaveBeenCalled()
    })

    it('should configure MCP for multiple platforms', async () => {
      const platform1: DetectedPlatform = {
        name: 'Mock Platform 1',
        key: 'mock1',
        detected: true,
        configHint: '~/.mock1',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }
      const platform2: DetectedPlatform = {
        name: 'Mock Platform 2',
        key: 'mock2',
        detected: true,
        configHint: '~/.mock2',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }

      await createBrainMCP({
        configuredPlatforms: [platform1, platform2],
        brainPath: '/tmp/brain',
        brainId: 'test-brain',
        homeDir: '/tmp/home'
      })

      expect(platform1.module.patch).toHaveBeenCalled()
      expect(platform2.module.patch).toHaveBeenCalled()
    })

    it('should use default homeDir when not provided', async () => {
      const mockPlatform: DetectedPlatform = {
        name: 'Mock Platform',
        key: 'mock',
        detected: true,
        configHint: '~/.mock',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          unpatch: vi.fn().mockResolvedValue(undefined)
        }
      }

      await createBrainMCP({
        configuredPlatforms: [mockPlatform],
        brainPath: '/tmp/brain',
        brainId: 'test-brain'
      })

      expect(mockPlatform.module.patch).toHaveBeenCalled()
    })

    it('should handle empty configuredPlatforms array', async () => {
      await expect(
        createBrainMCP({
          configuredPlatforms: [],
          brainPath: '/tmp/brain',
          brainId: 'test-brain'
        })
      ).resolves.toBeUndefined()
    })
  })
})
