import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BRAIN_SKILL_MD = readFileSync(join(__dirname, 'brain-skills.md'), 'utf8')

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.codex'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const codexDir = join(homeDir, '.codex')
  const configPath = join(codexDir, 'config.toml')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(codexDir, { recursive: true })

  let existing = ''
  if (existsSync(configPath)) {
    existing = readFileSync(configPath, 'utf8')
  }

  // Remove existing ai-brain block if present, then append fresh
  const cleaned = existing.replace(/\[mcp_servers\.ai-brain\][^\[]*/s, '').trim()
  const entry = `\n\n[mcp_servers.ai-brain]\ncommand = "${python}"\nargs = ["-m", "graphify.serve", "${graphPath}"]\n`

  writeFileSync(configPath, cleaned + entry, 'utf8')
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.codex', 'skills', 'brain')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'SKILL.md'), BRAIN_SKILL_MD, 'utf8')
}

export async function installAlwaysOn() {
  // Skills are used instead of always-on rules
}
