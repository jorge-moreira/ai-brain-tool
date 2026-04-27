import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('execa', () => ({
  execa: vi.fn()
}))

describe('platforms/index', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('detectAll', () => {
    it('should return an array of platform objects with name, key, and detected properties', async () => {
      const { detectAll } = await import('../../../src/platforms/index')
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
      const { configureSelected } = await import('../../../src/platforms/index')
      const mockPlatform = {
        module: {
          patch: vi.fn().mockResolvedValue(),
          installSkill: vi.fn().mockResolvedValue(),
          installAlwaysOn: vi.fn().mockResolvedValue()
        }
      }
      
      await configureSelected({ 
        selected: [mockPlatform], 
        brainPath: '/tmp/brain',
        homeDir: '/tmp/home'
      })

      expect(mockPlatform.module.patch).toHaveBeenCalledWith({ brainPath: '/tmp/brain', homeDir: '/tmp/home' })
      expect(mockPlatform.module.installSkill).toHaveBeenCalledWith({ homeDir: '/tmp/home' })
      expect(mockPlatform.module.installAlwaysOn).toHaveBeenCalledWith({ brainPath: '/tmp/brain', homeDir: '/tmp/home' })
    })

    it('should configure multiple platforms', async () => {
      const { configureSelected } = await import('../../../src/platforms/index')
      const platform1 = {
        module: {
          patch: vi.fn().mockResolvedValue(),
          installSkill: vi.fn().mockResolvedValue(),
          installAlwaysOn: vi.fn().mockResolvedValue()
        }
      }
      const platform2 = {
        module: {
          patch: vi.fn().mockResolvedValue(),
          installSkill: vi.fn().mockResolvedValue(),
          installAlwaysOn: vi.fn().mockResolvedValue()
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
