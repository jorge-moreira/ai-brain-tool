import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BRAIN_SKILL_MD = readFileSync(join(__dirname, 'brain-skills.md'), 'utf8')

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.config', 'gh'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  // Copilot CLI does not use a JSON MCP config
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.copilot', 'skills', 'brain')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'SKILL.md'), BRAIN_SKILL_MD, 'utf8')
}

export async function installAlwaysOn() {
  // Skills are used instead of always-on rules
}
