import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { patchJsonConfig, pythonBin, graphJson, BRAIN_SKILL_MD, installSkillFile } from './shared.js'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.claude'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const claudeDir = join(homeDir, '.claude')
  const mcpPath = join(claudeDir, 'mcp.json')

  patchJsonConfig({
    configPath: mcpPath,
    configKey: 'mcpServers',
    serverEntry: {
      'ai-brain': {
        type: 'stdio',
        command: pythonBin(brainPath),
        args: ['-m', 'graphify.serve', graphJson(brainPath)],
      },
    },
  })
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.claude', 'commands')
  installSkillFile({
    dir: skillDir,
    filename: 'brain.md',
    content: BRAIN_SKILL_MD,
  })
}

export async function installAlwaysOn() {
  // Skills are used instead of always-on rules
}
