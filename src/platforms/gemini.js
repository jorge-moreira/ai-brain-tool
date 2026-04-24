import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BRAIN_SKILL_MD = readFileSync(join(__dirname, 'brain-skills.md'), 'utf8')

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

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.gemini', 'skills', 'brain')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'SKILL.md'), BRAIN_SKILL_MD, 'utf8')
}

export async function installAlwaysOn() {
  // Skills are used instead of always-on rules
}
