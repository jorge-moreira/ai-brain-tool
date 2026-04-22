import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.cursor'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const cursorDir = join(homeDir, '.cursor')
  const mcpPath = join(cursorDir, 'mcp.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(cursorDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(mcpPath)) {
    try { config = JSON.parse(readFileSync(mcpPath, 'utf8')) } catch {
      throw new Error(`Could not parse existing config at ${mcpPath}. Please fix the JSON before running setup.`)
    }
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(mcpPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {}
