import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.config', 'opencode'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const configDir = join(homeDir, '.config', 'opencode')
  const configPath = join(configDir, 'opencode.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(configDir, { recursive: true })

  let config = {}
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, 'utf8')) } catch {
      throw new Error(`Could not parse existing config at ${configPath}. Please fix the JSON before running setup.`)
    }
  }
  if (!config.mcp) config.mcp = {}

  config.mcp['ai-brain'] = {
    type: 'local',
    command: [python, '-m', 'graphify.serve', graphPath],
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {
  // OpenCode skill installation handled via opencode.json mcp entry
}
