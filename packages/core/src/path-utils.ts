import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * Find the @ai-brain/core package root directory.
 * Works in both development (CLI) and bundled (ElectroBun, etc.) contexts.
 */
export function getPackageRoot(): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  
  // Bundled context detection: if we're in a path containing 'app/bun',
  // we're in an ElectroBun bundle where resources are at app/core
  if (__dirname.includes('app/bun')) {
    // From app/bun, go up to app, then into core
    const appDir = join(__dirname, '..')
    const corePath = join(appDir, 'core')
    if (existsSync(join(corePath, 'package.json'))) {
      return corePath
    }
  }
  
  // Development/CLI context: walk up to find package.json
  let currentDir = __dirname
  while (currentDir !== '/' && currentDir !== '.') {
    if (existsSync(join(currentDir, 'package.json'))) {
      return currentDir
    }
    currentDir = dirname(currentDir)
  }
  
  throw new Error(
    'Could not find @ai-brain/core package root. ' +
    'Make sure package.json exists in the package directory.'
  )
}

/**
 * Get path to a resource file within @ai-brain/core package.
 * @param relativePath - Path relative to package root (e.g., 'requirements.txt', 'src/templates')
 */
export function getPackageResource(relativePath: string): string {
  const root = getPackageRoot()
  return join(root, relativePath)
}

