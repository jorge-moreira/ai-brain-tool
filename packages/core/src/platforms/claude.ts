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

export function detect(homeDir: string = homedir()): boolean {
  return existsSync(join(homeDir, '.claude'))
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
  const claudeDir = join(homeDir, '.claude')
  const mcpPath = join(claudeDir, 'mcp.json')

  patchJsonConfig({
    configPath: mcpPath,
    configKey: 'mcpServers',
    serverEntry: {
      [`ai-brain-${brainId}`]: {
        type: 'stdio',
        command: globalVenvPythonPath(),
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
  const claudeDir = join(homeDir, '.claude')
  const mcpPath = join(claudeDir, 'mcp.json')
  unpatchJsonConfig({
    configPath: mcpPath,
    configKey: 'mcpServers',
    serverName: `ai-brain-${brainId}`
  })
}

export async function installSkill({
  homeDir = homedir()
}: { homeDir?: string } = {}): Promise<void> {
  const skillDir = join(homeDir, '.claude', 'commands')
  installSkillFile({
    dir: skillDir,
    filename: 'brain.md',
    content: BRAIN_SKILL_MD
  })
}
