import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'

const _home = () => process.env.__HOME__ || homedir()

export function configPath() {
  return join(_home(), '.ai-brain-config.json')
}

export function readConfig() {
  const path = configPath()
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

export function writeConfig(data) {
  const path = configPath()
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
}

export function readBrainConfig(brainPath) {
  const configPath = join(brainPath, '.brain-config.json')
  if (!existsSync(configPath)) return { gitSync: false, extras: [], obsidianDir: null }
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    return { gitSync: false, extras: [], obsidianDir: null }
  }
}