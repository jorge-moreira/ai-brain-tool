import { existsSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { readConfig, writeConfig, createInitialConfig } from './state'
import { BrainNotFoundError, NotABrainError } from '../errors'
import { writeBrainConfig } from '../scaffold'
import { detectAll } from '../platforms'
import type { BrainConfig, BrainInfo, ResolvedBrain, GetBrainPathOptions } from './types'

const home = () => process.env.HOME || homedir()

const BRAIN_MARKERS: string[] = ['raw', '.graphifyignore', '.brain-config.json']

export function isExistingBrain(dir: string): boolean {
  return BRAIN_MARKERS.every(f => existsSync(join(dir, f)))
}

export async function removeBrain(brainId: string, deleteFolder = false): Promise<void> {
  const config = readConfig()
  if (!config.brains || !config.brains[brainId]) {
    throw new BrainNotFoundError(brainId)
  }
  const brainPath = config.brains[brainId]
  const aiTools = config.aiTools || []
  const { [brainId]: _removed, ...remainingBrains } = config.brains
  config.brains = remainingBrains
  writeConfig(config)

  const homeDir = home()
  const platforms = await detectAll(homeDir)

  for (const tool of aiTools) {
    const platform = platforms.find(p => p.key === tool)
    if (platform?.module.unpatch) {
      await platform.module.unpatch({ brainId, homeDir })
    }
  }

  if (deleteFolder && brainPath) {
    rmSync(brainPath, { recursive: true, force: true })
  }
}

export function importBrain(path: string): string {
  if (!isExistingBrain(path)) {
    throw new NotABrainError(path, BRAIN_MARKERS)
  }
  const brainId = path.split('/').at(-1) ?? path
  addBrain(brainId, path)
  return brainId
}

export function resolveBrain(brainId?: string): ResolvedBrain {
  const config = readConfig()
  const brains = config.brains || {}

  if (brainId) {
    if (!brains[brainId]) {
      throw new BrainNotFoundError(brainId)
    }
    return { id: brainId, path: brains[brainId], isLocal: false }
  }

  const cwd = process.cwd()
  for (const [id, path] of Object.entries(brains)) {
    const normalizedPath = path.replace(/^~/, home())
    if (cwd.startsWith(normalizedPath) || cwd === normalizedPath) {
      return { id, path: normalizedPath, isLocal: true }
    }
  }

  if (Object.keys(brains).length === 0) {
    throw new Error('No brains configured. Run: ai-brain setup')
  }

  throw new Error('Not in a brain folder. Specify brain identifier: ai-brain update <brain-id>')
}

export function listBrains(): BrainInfo[] {
  const config = readConfig()
  return Object.entries(config.brains || {}).map(([id, path]) => ({
    id,
    path: path.replace(/^~/, home())
  }))
}

export function addBrain(brainId: string, path: string): void {
  let config
  try {
    config = readConfig()
  } catch {
    config = createInitialConfig()
  }
  if (!config.brains) config.brains = {}
  config.brains[brainId] = path.replace(/^~/, home())
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

export function readBrainConfig(brainPath: string): BrainConfig {
  const configPath = join(brainPath, '.brain-config.json')
  if (!existsSync(configPath)) return { gitSync: false, obsidianDir: null }
  try {
    return JSON.parse(readFileSync(configPath, 'utf8')) as BrainConfig
  } catch {
    return { gitSync: false, obsidianDir: null }
  }
}

export function getBrainPath(args?: string[], options: GetBrainPathOptions = {}): string {
  const brainId = options.brainId || (args && args.find(a => a && !a.startsWith('-')))

  if (brainId) {
    const resolved = resolveBrain(brainId)
    return resolved.path
  }

  const config = readConfig()
  const brains = config.brains || {}
  const cwd = process.cwd()

  for (const [, path] of Object.entries(brains)) {
    const normalizedPath = path.replace(/^~/, home())
    if (cwd.startsWith(normalizedPath) || cwd === normalizedPath) {
      return normalizedPath
    }
  }

  if (Object.keys(brains).length === 0) {
    throw new Error('No brain configured. Run: ai-brain setup')
  }

  const availableBrains = Object.keys(brains).join(', ')
  throw new Error(
    'Not in a brain folder. ' +
      `Specify brain with --brain-id flag or positional argument.\n` +
      `  Available: ${availableBrains}\n` +
      `  Examples:\n` +
      `    ai-brain update ${availableBrains.split(',')[0].trim()}\n` +
      `    ai-brain update --brain-id ${availableBrains.split(',')[0].trim()}`
  )
}

export function toggleSync(brainPath: string, enabled: boolean): void {
  const brainConfig = readBrainConfig(brainPath)
  writeBrainConfig({ brainPath, gitSync: enabled, obsidianDir: brainConfig.obsidianDir ?? null })
}

export function toggleSyncById(brainId: string, enabled: boolean): void {
  const { path } = resolveBrain(brainId)
  toggleSync(path, enabled)
}
