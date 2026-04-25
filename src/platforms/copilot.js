import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { BRAIN_SKILL_MD, installSkillFile } from './shared.js'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.config', 'gh'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  // Copilot CLI does not use a JSON MCP config
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.copilot', 'skills', 'brain')
  installSkillFile({
    dir: skillDir,
    filename: 'SKILL.md',
    content: BRAIN_SKILL_MD,
  })
}

export async function installAlwaysOn() {
  // Skills are used instead of always-on rules
}
