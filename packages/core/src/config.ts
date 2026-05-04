import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const _home = () => process.env.__HOME__ || homedir()
const _configDir = () => join(_home(), '.ai-brain-tool')

export function configPath(): string {
  return join(_configDir(), 'config.json')
}

export function createInitialConfig(): Config {
  return {
    installationComplete: false,
    graphifyyExtras: [],
    aiTools: [],
    brains: {}
  }
}

export function isInstallationComplete(): boolean {
  const path = configPath()
  if (!existsSync(path)) return false
  try {
    const config = readConfig()
    return config.installationComplete === true
  } catch {
    return false
  }
}

export function setInstallationComplete(): void {
  const path = configPath()
  let config: Config
  if (existsSync(path)) {
    config = readConfig()
  } else {
    config = createInitialConfig()
  }
  config.installationComplete = true
  writeConfig(config)
}

export function addGraphifyyExtra(extra: string): void {
  const path = configPath()
  let config: Config
  if (existsSync(path)) {
    config = readConfig()
  } else {
    config = createInitialConfig()
  }
  if (!config.graphifyyExtras.includes(extra)) {
    config.graphifyyExtras.push(extra)
  }
  writeConfig(config)
}

export function ensureConfigDir(): void {
  const dir = _configDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export interface BrainConfig {
  gitSync: boolean
  obsidianDir?: string | null
}

export interface Config {
  installationComplete: boolean
  graphifyyExtras: string[]
  aiTools: string[]
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
    throw new Error('Config not found. Run `ai-brain setup` to configure.')
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Config
  } catch {
    throw new Error('Config parse error. Please check your config file.')
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
      throw new Error(
        `Brain "${brainId}" not found. Available: ${Object.keys(brains).join(', ') || 'none'}`
      )
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
    config = createInitialConfig()
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
  const { [brainId]: _removed, ...remainingBrains } = config.brains
  config.brains = remainingBrains
  writeConfig(config)
}

export function readBrainConfig(brainPath: string): BrainConfig {
  const configPath = join(brainPath, '.brain-config.json')
  if (!existsSync(configPath)) return { gitSync: false, obsidianDir: null }
  try {
    return JSON.parse(readFileSync(configPath, 'utf8')) as BrainConfig
  } catch {
    return { gitSync: false, obsidianDir: null }
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
  for (const [_, path] of Object.entries(brains)) {
    const normalizedPath = path.replace(/^~/, _home())
    if (cwd.startsWith(normalizedPath) || cwd === normalizedPath) {
      return normalizedPath
    }
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
