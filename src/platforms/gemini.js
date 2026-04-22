import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.gemini'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const geminiDir = join(homeDir, '.gemini')
  const settingsPath = join(geminiDir, 'settings.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(geminiDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(settingsPath)) {
    try { config = JSON.parse(readFileSync(settingsPath, 'utf8')) } catch {
      throw new Error(`Could not parse existing config at ${settingsPath}. Please fix the JSON before running setup.`)
    }
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(settingsPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {}
