import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const _home = () => process.env.__HOME__ || homedir()
const _configDir = () => join(_home(), '.ai-brain-tool')

export function configPath(): string {
  return join(_configDir(), 'config.json')
}

export function ensureConfigDir(): void {
  const dir = _configDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export interface BrainConfig {
  gitSync: boolean
  extras: string[]
  obsidianDir: string | null
  id: string | null
}

export interface Config {
  brains: Record<string, string>
}

export interface ResolvedBrain {
  id: string
  path: string
  isLocal: boolean
}

export function readConfig(): Config {
  const path = configPath()
  if (!existsSync(path)) {
    throw new Error('CONFIG_NOT_FOUND')
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    throw new Error('CONFIG_PARSE_ERROR')
  }
}

export function writeConfig(data: Config): void {
  ensureConfigDir()
  const path = configPath()
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
}

export function resolveBrain(brainId?: string): ResolvedBrain {
  const config = readConfig()
  const brains = config.brains || {}

  if (brainId) {
    if (!brains[brainId]) {
      throw new Error(`Brain "${brainId}" not found. Available: ${Object.keys(brains).join(', ') || 'none'}`)
    }
    return { id: brainId, path: brains[brainId], isLocal: false }
  }

  const cwd = process.cwd()
  for (const [id, path] of Object.entries(brains)) {
    const normalizedPath = path.replace(/^~/, _home())
    if (cwd.startsWith(normalizedPath) || cwd === normalizedPath) {
      return { id, path: normalizedPath, isLocal: true }
    }
  }

  const localPath = join(cwd, '.brain-config.json')
  if (existsSync(localPath)) {
    try {
      const localConfig = JSON.parse(readFileSync(localPath, 'utf8'))
      if (localConfig.id) {
        return { id: localConfig.id, path: cwd, isLocal: true }
      }
    } catch {}
  }

  if (Object.keys(brains).length === 0) {
    throw new Error('No brains configured. Run: ai-brain setup')
  }

  throw new Error('Not in a brain folder. Specify brain identifier: ai-brain update <brain-id>')
}

export interface BrainInfo {
  id: string
  path: string
}

export function listBrains(): BrainInfo[] {
  const config = readConfig()
  return Object.entries(config.brains || {}).map(([id, path]) => ({
    id,
    path: path.replace(/^~/, _home())
  }))
}

export function addBrain(brainId: string, path: string): void {
  let config: Config
  try {
    config = readConfig()
  } catch {
    config = { brains: {} }
  }
  if (!config.brains) config.brains = {}
  config.brains[brainId] = path.replace(/^~/, _home())
  writeConfig(config)
}

export function isBrainIdAvailable(brainId: string): boolean {
  try {
    const config = readConfig()
    return !config.brains || !config.brains[brainId]
  } catch {
    return true
  }
}

export function removeBrain(brainId: string): void {
  const config = readConfig()
  if (!config.brains || !config.brains[brainId]) {
    throw new Error(`Brain "${brainId}" not found`)
  }
  delete config.brains[brainId]
  writeConfig(config)
}

export function readBrainConfig(brainPath: string): BrainConfig {
  const configPath = join(brainPath, '.brain-config.json')
  if (!existsSync(configPath)) return { gitSync: false, extras: [], obsidianDir: null, id: null }
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    return { gitSync: false, extras: [], obsidianDir: null, id: null }
  }
}

export interface GetBrainPathOptions {
  brainId?: string
}

/**
 * Resolve brain path from args/options or detect from current folder.
 * @param args - Command arguments (may include brain-id as positional arg)
 * @param options - Command options (may include brainId)
 * @returns The resolved brain path
 */
export function getBrainPath(args?: string[], options: GetBrainPathOptions = {}): string {
  const brainId = options.brainId || (args && args.find(a => a && !a.startsWith('-')))
  
  // If brainId provided, resolve it directly
  if (brainId) {
    const resolved = resolveBrain(brainId)
    return resolved.path
  }
  
  // No brainId provided — try to detect from current folder or config
  const config = readConfig()
  const brains = config.brains || {}
  const cwd = process.cwd()
  
  // Check if we're inside a configured brain folder
  for (const [id, path] of Object.entries(brains)) {
    const normalizedPath = path.replace(/^~/, _home())
    if (cwd.startsWith(normalizedPath) || cwd === normalizedPath) {
      return normalizedPath
    }
  }
  
  // Check for local .brain-config.json in cwd
  const localPath = join(cwd, '.brain-config.json')
  if (existsSync(localPath)) {
    try {
      const localConfig = JSON.parse(readFileSync(localPath, 'utf8'))
      if (localConfig.id) {
        return cwd
      }
    } catch {}
  }
  
  // No brain detected — provide helpful error
  if (Object.keys(brains).length === 0) {
    throw new Error('No brain configured. Run: ai-brain setup')
  }
  
  const availableBrains = Object.keys(brains).join(', ')
  throw new Error(
    `Not in a brain folder. ` +
    `Specify brain with --brain-id flag or positional argument.\n` +
    `  Available: ${availableBrains}\n` +
    `  Examples:\n` +
    `    ai-brain update ${availableBrains.split(',')[0].trim()}\n` +
    `    ai-brain update --brain-id ${availableBrains.split(',')[0].trim()}`
  )
}
