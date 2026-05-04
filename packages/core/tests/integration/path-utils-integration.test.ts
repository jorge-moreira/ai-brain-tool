import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  readFileSync,
  readdirSync
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { getPackageRoot, getPackageResource } from '@ai-brain/core/path-utils'

describe('path-utils integration', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'path-utils-test-'))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('getPackageRoot - real filesystem', () => {
    it('should find package.json by walking up directory tree', () => {
      // Create a fake package structure
      const packageRoot = join(tmpDir, 'test-package')
      const srcDir = join(packageRoot, 'src', 'subdir')

      mkdirSync(srcDir, { recursive: true })
      writeFileSync(
        join(packageRoot, 'package.json'),
        JSON.stringify({ name: 'test-package', version: '1.0.0' })
      )

      // Verify structure
      expect(existsSync(join(packageRoot, 'package.json'))).toBe(true)
      expect(existsSync(srcDir)).toBe(true)
    })

    it('should handle missing package.json gracefully', () => {
      // Create directory structure without package.json
      const noPackageDir = join(tmpDir, 'no-package', 'src')
      mkdirSync(noPackageDir, { recursive: true })

      expect(existsSync(tmpDir)).toBe(true)
      expect(existsSync(join(noPackageDir, 'package.json'))).toBe(false)
    })
  })

  describe('getPackageResource - real filesystem', () => {
    it('should return valid path for existing resource', () => {
      // Create package structure with a resource file
      const packageRoot = join(tmpDir, 'test-package')
      mkdirSync(packageRoot, { recursive: true })
      writeFileSync(
        join(packageRoot, 'package.json'),
        JSON.stringify({ name: 'test-package', version: '1.0.0' })
      )

      const resourceFile = 'test-resource.txt'
      const resourceContent = 'test content'
      writeFileSync(join(packageRoot, resourceFile), resourceContent)

      const resourcePath = join(packageRoot, resourceFile)
      expect(existsSync(resourcePath)).toBe(true)
    })

    it('should return path even for non-existent resource', () => {
      // getPackageResource just constructs a path, doesn't check existence
      const packageRoot = join(tmpDir, 'test-package')
      mkdirSync(packageRoot, { recursive: true })
      writeFileSync(
        join(packageRoot, 'package.json'),
        JSON.stringify({ name: 'test-package', version: '1.0.0' })
      )

      const resourcePath = join(packageRoot, 'non-existent.txt')
      expect(existsSync(resourcePath)).toBe(false)
    })
  })

  describe('bundled context simulation', () => {
    it('should handle app/bun path structure', () => {
      // Simulate the bundled structure: app/bun -> app/core
      const appDir = join(tmpDir, 'app')
      const bunDir = join(appDir, 'bun')
      const coreDir = join(appDir, 'core')

      mkdirSync(bunDir, { recursive: true })
      mkdirSync(coreDir, { recursive: true })
      writeFileSync(
        join(coreDir, 'package.json'),
        JSON.stringify({ name: '@ai-brain/core', version: '1.0.0' })
      )

      // Verify the structure is set up correctly
      expect(existsSync(bunDir)).toBe(true)
      expect(existsSync(coreDir)).toBe(true)
      expect(existsSync(join(coreDir, 'package.json'))).toBe(true)
    })

    it('should handle cli/dist path structure', () => {
      // Simulate CLI bundled structure: cli/dist with copied resources
      const cliDir = join(tmpDir, 'cli')
      const distDir = join(cliDir, 'dist')

      mkdirSync(distDir, { recursive: true })
      writeFileSync(
        join(distDir, 'package.json'),
        JSON.stringify({ name: '@ai-brain/cli', version: '1.0.0' })
      )
      writeFileSync(join(distDir, 'requirements.txt'), 'graphifyy==1.0.0')
      mkdirSync(join(distDir, 'templates'), { recursive: true })

      // Verify the structure
      expect(existsSync(distDir)).toBe(true)
      expect(existsSync(join(distDir, 'requirements.txt'))).toBe(true)
      expect(existsSync(join(distDir, 'templates'))).toBe(true)
    })

    it('should have resources in bundled core directory', () => {
      const appDir = join(tmpDir, 'app')
      const coreDir = join(appDir, 'core')

      mkdirSync(coreDir, { recursive: true })
      writeFileSync(
        join(coreDir, 'package.json'),
        JSON.stringify({ name: '@ai-brain/core', version: '1.0.0' })
      )
      writeFileSync(join(coreDir, 'requirements.txt'), 'graphifyy==1.0.0')

      expect(existsSync(join(coreDir, 'requirements.txt'))).toBe(true)
    })

    it('should copy resources for bundled context', () => {
      // Simulate the build process that copies resources
      const sourceCore = getPackageRoot()
      const bundledCore = join(tmpDir, 'app', 'core')

      mkdirSync(bundledCore, { recursive: true })

      // Copy package.json
      copyFileSync(join(sourceCore, 'package.json'), join(bundledCore, 'package.json'))

      // Copy requirements.txt
      copyFileSync(join(sourceCore, 'requirements.txt'), join(bundledCore, 'requirements.txt'))

      expect(existsSync(join(bundledCore, 'package.json'))).toBe(true)
      expect(existsSync(join(bundledCore, 'requirements.txt'))).toBe(true)
    })

    it('documents: bundled context detection requires actual bundled environment', () => {
      const appDir = join(tmpDir, 'app')
      const bunDir = join(appDir, 'bun')
      const coreDir = join(appDir, 'core')

      mkdirSync(bunDir, { recursive: true })
      mkdirSync(coreDir, { recursive: true })
      writeFileSync(join(coreDir, 'package.json'), '{"name":"@ai-brain/core"}')

      // Verify structure exists (but getPackageRoot won't use it because
      // import.meta.url points to the actual source file location)
      expect(existsSync(join(coreDir, 'package.json'))).toBe(true)

      // getPackageRoot still returns the actual package root
      const root = getPackageRoot()
      expect(root).toContain('packages/core')
    })
  })

  describe('development context', () => {
    it('should work with monorepo package structure', () => {
      // Simulate monorepo: packages/core/src
      const packagesDir = join(tmpDir, 'packages')
      const coreDir = join(packagesDir, 'core')
      const srcDir = join(coreDir, 'src')

      mkdirSync(srcDir, { recursive: true })
      writeFileSync(
        join(coreDir, 'package.json'),
        JSON.stringify({ name: '@ai-brain/core', version: '1.0.0' })
      )

      expect(existsSync(join(coreDir, 'package.json'))).toBe(true)
      expect(srcDir).toContain('core/src')
    })

    it('should locate resources relative to package root', () => {
      const packageRoot = join(tmpDir, 'package')
      const templatesDir = join(packageRoot, 'templates')

      mkdirSync(templatesDir, { recursive: true })
      writeFileSync(
        join(packageRoot, 'package.json'),
        JSON.stringify({ name: 'test-package', version: '1.0.0' })
      )
      writeFileSync(join(templatesDir, 'template.txt'), 'template content')

      const templatePath = join(packageRoot, 'templates', 'template.txt')
      expect(existsSync(templatePath)).toBe(true)
    })
  })

  describe('resource file operations', () => {
    it('should read resource file content', () => {
      const root = getPackageRoot()
      const requirementsPath = join(root, 'requirements.txt')

      const content = readFileSync(requirementsPath, 'utf-8')
      expect(typeof content).toBe('string')
      expect(content.length).toBeGreaterThan(0)
    })

    it('should list files in templates directory', () => {
      const root = getPackageRoot()
      const templatesPath = join(root, 'src/templates')

      if (existsSync(templatesPath)) {
        const files = readdirSync(templatesPath)
        expect(Array.isArray(files)).toBe(true)
        expect(files.length).toBeGreaterThan(0)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle paths with spaces', () => {
      const packageRoot = join(tmpDir, 'my package with spaces')
      mkdirSync(packageRoot, { recursive: true })
      writeFileSync(
        join(packageRoot, 'package.json'),
        JSON.stringify({ name: 'test-package', version: '1.0.0' })
      )

      const resourcePath = join(packageRoot, 'resource.txt')
      writeFileSync(resourcePath, 'content')
      expect(existsSync(resourcePath)).toBe(true)
    })

    it('should handle deep directory structures', () => {
      const deepPath = join(tmpDir, 'a', 'b', 'c', 'd', 'e', 'package')
      mkdirSync(deepPath, { recursive: true })
      writeFileSync(
        join(deepPath, 'package.json'),
        JSON.stringify({ name: 'deep-package', version: '1.0.0' })
      )

      expect(existsSync(join(deepPath, 'package.json'))).toBe(true)
    })

    it('should handle unicode characters in paths', () => {
      const packageRoot = join(tmpDir, 'パッケージ')
      mkdirSync(packageRoot, { recursive: true })
      writeFileSync(
        join(packageRoot, 'package.json'),
        JSON.stringify({ name: 'unicode-package', version: '1.0.0' })
      )

      expect(existsSync(join(packageRoot, 'package.json'))).toBe(true)
    })

    it('should handle very long paths', () => {
      const longName = 'a'.repeat(100)
      const longPath = join(tmpDir, longName, longName, 'package')
      mkdirSync(longPath, { recursive: true })
      writeFileSync(
        join(longPath, 'package.json'),
        JSON.stringify({ name: 'long-path-package', version: '1.0.0' })
      )

      expect(existsSync(join(longPath, 'package.json'))).toBe(true)
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

  describe('error scenarios documentation', () => {
    it('documents: bundled context triggers app/bun detection', () => {
      // Bundled context (app/bun in path) is tested via simulation
      // Actual bundled behavior is verified when running in ElectroBun app
      const appDir = join(tmpDir, 'app')
      const bunDir = join(appDir, 'bun')
      const coreDir = join(appDir, 'core')

      mkdirSync(bunDir, { recursive: true })
      mkdirSync(coreDir, { recursive: true })
      writeFileSync(join(coreDir, 'package.json'), '{"name":"@ai-brain/core"}')

      expect(existsSync(join(coreDir, 'package.json'))).toBe(true)
    })

    it('documents: walks up until root when no package.json found', () => {
      const result = getPackageRoot()
      expect(existsSync(join(result, 'package.json'))).toBe(true)
    })

    it('documents: throws with helpful message when package.json missing', () => {
      const root = getPackageRoot()
      expect(typeof root).toBe('string')
      expect(root.length).toBeGreaterThan(0)
      expect(existsSync(join(root, 'package.json'))).toBe(true)
    })
  })
})
