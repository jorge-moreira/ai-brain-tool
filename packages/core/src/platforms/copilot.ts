import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { globalVenvPythonPath } from '@ai-brain/core/graphify'
import {
  BRAIN_SKILL_MD,
  installSkillFile,
  patchJsonConfig,
  unpatchJsonConfig,
  graphJson
} from './shared'

const BRAIN_SKILL_MARKER = `---
name: brain
description: Personal AI brain — facade over graphify for easy knowledge graph management
trigger: /brain
---

`

export function detect(homeDir: string = homedir()): boolean {
  return existsSync(join(homeDir, '.copilot'))
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
  const configDir = join(homeDir, '.copilot')
  const configPath = join(configDir, 'mcp-config.json')

  patchJsonConfig({
    configPath,
    configKey: 'mcpServers',
    serverEntry: {
      [`ai-brain-${brainId}`]: {
        type: 'local',
        command: globalVenvPythonPath(),
        args: ['-m', 'graphify.serve', graphJson(brainPath)],
        env: {},
        tools: ['*']
      }
    }
  })
}

export async function installSkill({
  homeDir = homedir()
}: { homeDir?: string } = {}): Promise<void> {
  const skillDir = join(homeDir, '.copilot', 'skills', 'brain')
  installSkillFile({
    dir: skillDir,
    filename: 'SKILL.md',
    content: BRAIN_SKILL_MARKER + BRAIN_SKILL_MD
  })
}

export async function unpatch({
  brainId,
  homeDir = homedir()
}: {
  brainId: string
  homeDir?: string
}): Promise<void> {
  const configDir = join(homeDir, '.copilot')
  const configPath = join(configDir, 'mcp-config.json')
  unpatchJsonConfig({
    configPath,
    configKey: 'mcpServers',
    serverName: `ai-brain-${brainId}`
  })
}
