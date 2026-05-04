import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  detectAll,
  configureSelected,
  installSkills,
  connectBrain,
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
          installAlwaysOn: vi.fn().mockResolvedValue(undefined)
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
          installAlwaysOn: vi.fn().mockResolvedValue(undefined)
        }
      }

      await installSkills({ selected: [mockPlatform] })

      expect(mockPlatform.module.installSkill).toHaveBeenCalled()
    })

    it('should handle empty selected array', async () => {
      await expect(installSkills({ selected: [] })).resolves.toBeUndefined()
    })
  })

  describe('connectBrain', () => {
    it('should patch and install always-on for selected platforms', async () => {
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

      await connectBrain({
        selected: [mockPlatform],
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })

      expect(mockPlatform.module.patch).toHaveBeenCalledWith({
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })
      expect(mockPlatform.module.installAlwaysOn).toHaveBeenCalledWith({
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })
      expect(mockPlatform.module.installSkill).not.toHaveBeenCalled()
    })

    it('should connect brain for multiple platforms', async () => {
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

      await connectBrain({
        selected: [platform1, platform2],
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })

      expect(platform1.module.patch).toHaveBeenCalled()
      expect(platform1.module.installAlwaysOn).toHaveBeenCalled()
      expect(platform2.module.patch).toHaveBeenCalled()
      expect(platform2.module.installAlwaysOn).toHaveBeenCalled()
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
          installAlwaysOn: vi.fn().mockResolvedValue(undefined)
        }
      }

      await connectBrain({ selected: [mockPlatform], brainPath: '/tmp/brain' })

      expect(mockPlatform.module.patch).toHaveBeenCalled()
      expect(mockPlatform.module.installAlwaysOn).toHaveBeenCalled()
    })

    it('should handle empty selected array', async () => {
      await expect(connectBrain({ selected: [], brainPath: '/tmp/brain' })).resolves.toBeUndefined()
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

    it('should call both installSkills and connectBrain', async () => {
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

      expect(mockPlatform.module.installSkill).toHaveBeenCalledTimes(1)
      expect(mockPlatform.module.patch).toHaveBeenCalledTimes(1)
      expect(mockPlatform.module.installAlwaysOn).toHaveBeenCalledTimes(1)
    })
  })
})
