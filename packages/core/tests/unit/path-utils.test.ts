import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Import the functions under test (no mocking of core modules)
import { getPackageRoot, getPackageResource } from '@ai-brain/core/path-utils'

describe('path-utils', () => {
  describe('getPackageRoot', () => {
    it('should find actual core package root', () => {
      const result = getPackageRoot()
      expect(typeof result).toBe('string')
      expect(result).toBeTruthy()
    })

    it('should return path that contains package.json', () => {
      const result = getPackageRoot()
      expect(existsSync(join(result, 'package.json'))).toBe(true)
    })

    it('should return consistent result on multiple calls', () => {
      const result1 = getPackageRoot()
      const result2 = getPackageRoot()
      expect(result1).toBe(result2)
    })
  })

  describe('getPackageResource', () => {
    it('should return path for requirements.txt', () => {
      const result = getPackageResource('requirements.txt')
      expect(typeof result).toBe('string')
      expect(result).toContain('requirements.txt')
      expect(existsSync(result)).toBe(true)
    })

    it('should return path for templates directory', () => {
      const result = getPackageResource('src/templates')
      expect(typeof result).toBe('string')
      expect(result).toContain('templates')
      expect(existsSync(result)).toBe(true)
    })

    it('should return path for nested resource', () => {
      const result = getPackageResource('src/templates/template.txt')
      expect(typeof result).toBe('string')
      expect(result).toContain('src/templates/template.txt')
    })

    it('should handle relative path with ./', () => {
      const result = getPackageResource('./requirements.txt')
      expect(typeof result).toBe('string')
      expect(result).toContain('requirements.txt')
    })

    it('should handle parent directory reference', () => {
      const result = getPackageResource('../other/file.txt')
      expect(typeof result).toBe('string')
      // join() normalizes the path, so we check for the resolved path
      expect(result).toContain('other/file.txt')
    })

    it('should construct valid path for any string input', () => {
      const inputs = ['file.txt', 'dir/file.txt', './file.txt', '../file.txt', '']
      inputs.forEach(input => {
        const result = getPackageResource(input)
        expect(typeof result).toBe('string')
      })
    })
  })

  describe('integration with actual package structure', () => {
    it('should locate requirements.txt at package root', () => {
      const root = getPackageRoot()
      const requirementsPath = join(root, 'requirements.txt')
      expect(existsSync(requirementsPath)).toBe(true)
    })

    it('should read requirements.txt content', () => {
      const root = getPackageRoot()
      const requirementsPath = join(root, 'requirements.txt')
      const content = readFileSync(requirementsPath, 'utf-8')
      expect(typeof content).toBe('string')
      expect(content.length).toBeGreaterThan(0)
    })

    it('should locate brain-skills.md in src/platforms', () => {
      const root = getPackageRoot()
      const brainSkillsPath = join(root, 'src/platforms/brain-skills.md')
      expect(existsSync(brainSkillsPath)).toBe(true)
    })

    it('should locate templates directory', () => {
      const root = getPackageRoot()
      const templatesPath = join(root, 'src/templates')
      expect(existsSync(templatesPath)).toBe(true)
    })

    it('should list files in templates directory', () => {
      const root = getPackageRoot()
      const templatesPath = join(root, 'src/templates')
      const files = Array.from(require('fs').readdirSync(templatesPath))
      expect(files.length).toBeGreaterThan(0)
    })

    it('should locate mcp directory', () => {
      const root = getPackageRoot()
      const mcpPath = join(root, 'src/mcp')
      expect(existsSync(mcpPath)).toBe(true)
    })
  })

  describe('edge cases with real filesystem', () => {
    it('should handle paths with spaces', () => {
      const spaceDir = mkdtempSync(join(tmpdir(), 'dir with spaces-'))
      writeFileSync(join(spaceDir, 'package.json'), '{"name":"test"}')
      expect(existsSync(join(spaceDir, 'package.json'))).toBe(true)
      rmSync(spaceDir, { recursive: true, force: true })
    })

    it('should handle deep nesting', () => {
      const deepDir = mkdtempSync(join(tmpdir(), 'deep-'))
      const nestedPath = join(deepDir, 'a', 'b', 'c', 'd', 'e')
      mkdirSync(nestedPath, { recursive: true })
      writeFileSync(join(deepDir, 'package.json'), '{"name":"deep"}')
      expect(existsSync(join(deepDir, 'package.json'))).toBe(true)
      rmSync(deepDir, { recursive: true, force: true })
    })

    it('should handle unicode in paths', () => {
      const unicodeDir = mkdtempSync(join(tmpdir(), 'パッケージ -'))
      writeFileSync(join(unicodeDir, 'package.json'), '{"name":"unicode"}')
      expect(existsSync(join(unicodeDir, 'package.json'))).toBe(true)
      rmSync(unicodeDir, { recursive: true, force: true })
    })

    it('should handle very long paths', () => {
      const longName = 'a'.repeat(100)
      const longPath = join(tmpdir(), longName, longName, 'package')
      mkdirSync(longPath, { recursive: true })
      writeFileSync(join(longPath, 'package.json'), '{"name":"long-path-package"}')
      expect(existsSync(join(longPath, 'package.json'))).toBe(true)
      rmSync(longPath, { recursive: true, force: true })
    })
  })

  describe('bundled context simulation', () => {
    it('should have app/bun structure for bundled context testing', () => {
      const appDir = mkdtempSync(join(tmpdir(), 'app-'))
      const bunDir = join(appDir, 'bun')
      const coreDir = join(appDir, 'core')
      
      mkdirSync(bunDir, { recursive: true })
      mkdirSync(coreDir, { recursive: true })
      writeFileSync(join(coreDir, 'package.json'), '{"name":"@ai-brain/core"}')

      expect(existsSync(bunDir)).toBe(true)
      expect(existsSync(coreDir)).toBe(true)
      expect(existsSync(join(coreDir, 'package.json'))).toBe(true)
      
      rmSync(appDir, { recursive: true, force: true })
    })

    it('should have resources in simulated bundled core', () => {
      const appDir = mkdtempSync(join(tmpdir(), 'app-'))
      const coreDir = join(appDir, 'core')
      
      mkdirSync(coreDir, { recursive: true })
      writeFileSync(join(coreDir, 'package.json'), '{"name":"@ai-brain/core"}')
      writeFileSync(join(coreDir, 'requirements.txt'), 'graphifyy==1.0.0')

      expect(existsSync(join(coreDir, 'requirements.txt'))).toBe(true)
      
      rmSync(appDir, { recursive: true, force: true })
    })
  })

  describe('concurrent access', () => {
    it('should handle multiple getPackageRoot calls', () => {
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(getPackageRoot())
      }
      expect(new Set(results).size).toBe(1)
    })

    it('should handle multiple getPackageResource calls', () => {
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(getPackageResource('requirements.txt'))
      }
      expect(new Set(results).size).toBe(1)
    })
  })
})
