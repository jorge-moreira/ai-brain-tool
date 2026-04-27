import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { patchJsonConfig, pythonBin, graphJson, BRAIN_SKILL_MD, installSkillFile } from './shared.js'

const BRAIN_SKILL_MARKER = `---
description: ai-brain skill
alwaysApply: true
---

`

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.cursor'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const cursorDir = join(homeDir, '.cursor')
  const mcpPath = join(cursorDir, 'mcp.json')

  patchJsonConfig({
    configPath: mcpPath,
    configKey: 'mcpServers',
    serverEntry: {
      'ai-brain': {
        command: pythonBin(brainPath),
        args: ['-m', 'graphify.serve', graphJson(brainPath)],
      },
    },
  })
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.cursor', 'rules')
  installSkillFile({
    dir: skillDir,
    filename: 'brain.mdc',
    content: BRAIN_SKILL_MARKER + BRAIN_SKILL_MD,
  })
}

export async function installAlwaysOn() {
  // Skills are used instead of always-on rules
}
