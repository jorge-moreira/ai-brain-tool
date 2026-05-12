import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { globalVenvPythonPath } from '@ai-brain/core/graphify'
import {
  patchJsonConfig,
  unpatchJsonConfig,
  graphJson,
  BRAIN_SKILL_MD,
  installSkillFile
} from './shared'

const BRAIN_SKILL_MARKER = `---
name: brain
description: Personal AI brain — facade over graphify for easy knowledge graph management
trigger: /brain
---

`

export function detect(homeDir: string = homedir()): boolean {
  return existsSync(join(homeDir, '.config', 'opencode'))
}

export async function patch({
  brainPath,
  brainId,
  homeDir = homedir()
}: {
  brainPath: string
  brainId: string
  homeDir?: string
}): Promise<void> {
  const configDir = join(homeDir, '.config', 'opencode')
  const configPath = join(configDir, 'opencode.json')

  patchJsonConfig({
    configPath: configPath,
    configKey: 'mcp',
    serverEntry: {
      [`ai-brain-${brainId}`]: {
        type: 'local',
        command: [globalVenvPythonPath(), '-m', 'graphify.serve', graphJson(brainPath)]
      }
    }
  })
}

export async function unpatch({
  brainId,
  homeDir = homedir()
}: {
  brainId: string
  homeDir?: string
}): Promise<void> {
  const configDir = join(homeDir, '.config', 'opencode')
  const configPath = join(configDir, 'opencode.json')
  unpatchJsonConfig({
    configPath,
    configKey: 'mcp',
    serverName: `ai-brain-${brainId}`
  })
}

export async function installSkill({
  homeDir = homedir()
}: { homeDir?: string } = {}): Promise<void> {
  const skillDir = join(homeDir, '.config', 'opencode', 'skills', 'brain')
  installSkillFile({
    dir: skillDir,
    filename: 'SKILL.md',
    content: BRAIN_SKILL_MARKER + BRAIN_SKILL_MD
  })
}
