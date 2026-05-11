import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import {
  patchJsonConfig,
  unpatchJsonConfig,
  pythonBin,
  graphJson,
  BRAIN_SKILL_MD,
  installSkillFile
} from './shared.js'

const BRAIN_SKILL_MARKER = `---
description: ai-brain skill
alwaysApply: true
---

`

export function detect(homeDir: string = homedir()): boolean {
  return existsSync(join(homeDir, '.cursor'))
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
  const cursorDir = join(homeDir, '.cursor')
  const mcpPath = join(cursorDir, 'mcp.json')

  patchJsonConfig({
    configPath: mcpPath,
    configKey: 'mcpServers',
    serverEntry: {
      [`ai-brain-${brainId}`]: {
        command: pythonBin(brainPath),
        args: ['-m', 'graphify.serve', graphJson(brainPath)]
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
  const cursorDir = join(homeDir, '.cursor')
  const mcpPath = join(cursorDir, 'mcp.json')
  unpatchJsonConfig({
    configPath: mcpPath,
    configKey: 'mcpServers',
    serverName: `ai-brain-${brainId}`
  })
}

export async function installSkill({
  homeDir = homedir()
}: { homeDir?: string } = {}): Promise<void> {
  const skillDir = join(homeDir, '.cursor', 'rules')
  installSkillFile({
    dir: skillDir,
    filename: 'brain.mdc',
    content: BRAIN_SKILL_MARKER + BRAIN_SKILL_MD
  })
}
