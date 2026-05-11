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

export function detect(homeDir: string = homedir()): boolean {
  return existsSync(join(homeDir, '.gemini'))
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
  const geminiDir = join(homeDir, '.gemini')
  const settingsPath = join(geminiDir, 'settings.json')

  patchJsonConfig({
    configPath: settingsPath,
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
  const geminiDir = join(homeDir, '.gemini')
  const settingsPath = join(geminiDir, 'settings.json')
  unpatchJsonConfig({
    configPath: settingsPath,
    configKey: 'mcpServers',
    serverName: `ai-brain-${brainId}`
  })
}

export async function installSkill({
  homeDir = homedir()
}: { homeDir?: string } = {}): Promise<void> {
  const skillDir = join(homeDir, '.gemini', 'skills', 'brain')
  installSkillFile({
    dir: skillDir,
    filename: 'SKILL.md',
    content: BRAIN_SKILL_MD
  })
}
