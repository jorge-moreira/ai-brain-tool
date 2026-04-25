import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('platforms/index', () => {
  describe('detectAll', () => {
    it('should return an array of platform objects with name, key, and detected properties', async () => {
      const { detectAll } = await import('../../src/platforms/index.js')
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
})
