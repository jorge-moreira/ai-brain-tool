import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectAll, configureSelected, DetectedPlatform } from '@ai-brain/core/platforms/index'

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
  })

  describe('configureSelected', () => {
    it('should configure selected platforms', async () => {
      const mockPlatform: DetectedPlatform = {
        name: 'Mock Platform',
        key: 'mock',
        detected: true,
        configHint: '~/.mock',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          installAlwaysOn: vi.fn().mockResolvedValue(undefined)
        }
      }

      await configureSelected({
        selected: [mockPlatform],
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })

      expect(mockPlatform.module.patch).toHaveBeenCalledWith({
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })
      expect(mockPlatform.module.installSkill).toHaveBeenCalledWith({ homeDir: '/tmp/home' })
      expect(mockPlatform.module.installAlwaysOn).toHaveBeenCalledWith({
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })
    })

    it('should configure multiple platforms', async () => {
      const platform1: DetectedPlatform = {
        name: 'Mock Platform 1',
        key: 'mock1',
        detected: true,
        configHint: '~/.mock1',
        module: {
          detect: vi.fn().mockReturnValue(true),
          patch: vi.fn().mockResolvedValue(undefined),
          installSkill: vi.fn().mockResolvedValue(undefined),
          installAlwaysOn: vi.fn().mockResolvedValue(undefined)
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
          installAlwaysOn: vi.fn().mockResolvedValue(undefined)
        }
      }

      await configureSelected({
        selected: [platform1, platform2],
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })

      expect(platform1.module.patch).toHaveBeenCalled()
      expect(platform2.module.patch).toHaveBeenCalled()
    })
  })
})
