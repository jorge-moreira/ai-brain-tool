import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import * as path from 'path'

// 1. Define the function signatures clearly
type ExistsSyncFn = (p: string) => boolean
type FileURLToPathFn = (u: string) => string

// 2. Define the interfaces using those signatures
interface MockFs {
  existsSync: Mock<ExistsSyncFn>
}

interface MockUrl {
  fileURLToPath: Mock<FileURLToPathFn>
}

interface HoistedMocks {
  mockFs: MockFs
  mockUrl: MockUrl
}

// 3. Cast the hoisted result.
// This resolves the "Unsafe assignment" and "Type argument" errors.
const { mockFs, mockUrl } = vi.hoisted(() => ({
  mockFs: {
    existsSync: vi.fn() as Mock<ExistsSyncFn>
  },
  mockUrl: {
    fileURLToPath: vi.fn() as Mock<FileURLToPathFn>
  }
})) as HoistedMocks

// 4. TOP-LEVEL MOCKS
vi.mock('node:fs', async importActual => {
  const actual = await importActual<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: (p: string): boolean => mockFs.existsSync(p)
  }
})

vi.mock('node:url', async importActual => {
  const actual = await importActual<typeof import('node:url')>()
  return {
    ...actual,
    fileURLToPath: (u: string): string => mockUrl.fileURLToPath(u)
  }
})

import { getPackageRoot, getPackageResource } from '../../src/path-utils'

describe('Package Path Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPackageRoot', () => {
    it('should find the root in a bundled ElectroBun context', () => {
      const fakeFile = path.join('/mock', 'app', 'bun', 'index.js')
      mockUrl.fileURLToPath.mockReturnValue(fakeFile)

      mockFs.existsSync.mockImplementation((p: string): boolean => {
        const normalized = p.replace(/\\/g, '/')
        return normalized.endsWith('app/core/package.json')
      })

      const root = getPackageRoot()
      expect(root.replace(/\\/g, '/')).toBe('/mock/app/core')
    })

    it('should walk up the directory tree in a development context', () => {
      const fakeFile = path.join('/mock', 'dev', 'src', 'index.ts')
      mockUrl.fileURLToPath.mockReturnValue(fakeFile)

      mockFs.existsSync.mockImplementation((p: string): boolean => {
        const normalized = p.replace(/\\/g, '/')
        return normalized === '/mock/dev/package.json'
      })

      const root = getPackageRoot()
      expect(root.replace(/\\/g, '/')).toBe('/mock/dev')
    })

    it('should throw an error if package.json is never found', () => {
      mockUrl.fileURLToPath.mockReturnValue('/nowhere/index.js')
      mockFs.existsSync.mockReturnValue(false)

      expect(() => getPackageRoot()).toThrow(/Could not find @ai-brain\/core package root/)
    })

    it('should return dist folder when in cli/dist context', () => {
      const fakeFile = path.join('/mock', 'cli', 'dist', 'index.js')
      mockUrl.fileURLToPath.mockReturnValue(fakeFile)

      const root = getPackageRoot()
      expect(root.replace(/\\/g, '/')).toBe('/mock/cli/dist')
    })
  })

  describe('getPackageResource', () => {
    it('should append the relative path to the package root', () => {
      mockUrl.fileURLToPath.mockReturnValue(path.join('/mock', 'root', 'index.ts'))
      mockFs.existsSync.mockImplementation((p: string): boolean => {
        return p.replace(/\\/g, '/').endsWith('mock/root/package.json')
      })

      const result = getPackageResource('config.json')
      expect(result.replace(/\\/g, '/')).toBe('/mock/root/config.json')
    })
  })
})
