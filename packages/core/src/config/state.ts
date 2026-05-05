import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { Config } from './types'

const home = () => process.env.__HOME__ || homedir()
const configDir = () => join(home(), '.ai-brain-tool')

export function configPath(): string {
  return join(configDir(), 'config.json')
}

export function createInitialConfig(): Config {
  return {
    installationComplete: false,
    graphifyyExtras: [],
    aiTools: [],
    brains: {}
  }
}

export function ensureConfigDir(): void {
  const dir = configDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
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

/** Mutate config safely: reads, applies fn, writes. Creates initial config if missing. */
export function updateConfig(fn: (cfg: Config) => void): void {
  const path = configPath()
  let config: Config
  if (existsSync(path)) {
    config = readConfig()
  } else {
    config = createInitialConfig()
  }
  fn(config)
  writeConfig(config)
}

export function isInstallationComplete(): boolean {
  const path = configPath()
  if (!existsSync(path)) return false
  try {
    const config = readConfig()
    return config.installationComplete
  } catch {
    return false
  }
}

export function setInstallationComplete(): void {
  updateConfig(c => {
    c.installationComplete = true
  })
}

export function addGraphifyyExtra(extra: string): void {
  updateConfig(c => {
    if (!c.graphifyyExtras.includes(extra)) {
      c.graphifyyExtras.push(extra)
    }
  })
}
