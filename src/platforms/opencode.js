import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { patchJsonConfig, pythonBin, graphJson, BRAIN_SKILL_MD, installSkillFile } from './shared.js'

const BRAIN_SKILL_MARKER = `---
name: brain
description: Personal AI brain — facade over graphify for easy knowledge graph management
trigger: /brain
---

`

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.config', 'opencode'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const configDir = join(homeDir, '.config', 'opencode')
  const configPath = join(configDir, 'opencode.json')

  patchJsonConfig({
    configPath: configPath,
    configKey: 'mcp',
    serverEntry: {
      'ai-brain': {
        type: 'local',
        command: [pythonBin(brainPath), '-m', 'graphify.serve', graphJson(brainPath)],
      },
    },
  })
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.config', 'opencode', 'skills', 'brain')
  installSkillFile({
    dir: skillDir,
    filename: 'SKILL.md',
    content: BRAIN_SKILL_MARKER + BRAIN_SKILL_MD,
  })
}

export async function installAlwaysOn() {
  // Skills are used instead of always-on rules
}
