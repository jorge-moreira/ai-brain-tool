import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'

const _home = () => process.env.__HOME__ || homedir()
const _configDir = () => join(_home(), '.ai-brain-tool')

export function configPath() {
  return join(_configDir(), 'config.json')
}

export function ensureConfigDir() {
  const dir = _configDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

import chalk from 'chalk'

export function readConfig() {
  const path = configPath()
  if (!existsSync(path)) {
    console.error(chalk.red(`  Config not found: ${path}`))
    console.error(chalk.red('  Run: ai-brain setup'))
    throw new Error('CONFIG_NOT_FOUND')
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    console.error(chalk.red(`  Config parse error: ${path}`))
    throw new Error('CONFIG_PARSE_ERROR')
  }
}

export function writeConfig(data) {
  ensureConfigDir()
  const path = configPath()
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
}

export function resolveBrain(brainId) {
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

  throw new Error('Not in a brain folder. Specify brain ID: ai-brain update <brain-id>')
}

export function listBrains() {
  const config = readConfig()
  return Object.entries(config.brains || {}).map(([id, path]) => ({
    id,
    path: path.replace(/^~/, _home())
  }))
}

export function addBrain(brainId, path) {
  let config
  try {
    config = readConfig()
  } catch {
    config = { brains: {} }
  }
  if (!config.brains) config.brains = {}
  config.brains[brainId] = path.replace(/^~/, _home())
  writeConfig(config)
}

export function isBrainIdAvailable(brainId) {
  try {
    const config = readConfig()
    return !config.brains || !config.brains[brainId]
  } catch {
    return true
  }
}

export function removeBrain(brainId) {
  const config = readConfig()
  if (!config.brains || !config.brains[brainId]) {
    throw new Error(`Brain "${brainId}" not found`)
  }
  delete config.brains[brainId]
  writeConfig(config)
}

export function readBrainConfig(brainPath) {
  const configPath = join(brainPath, '.brain-config.json')
  if (!existsSync(configPath)) return { gitSync: false, extras: [], obsidianDir: null, id: null }
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    return { gitSync: false, extras: [], obsidianDir: null, id: null }
  }
}