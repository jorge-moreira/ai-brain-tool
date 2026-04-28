import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import {
  patchJsonConfig,
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
  homeDir = homedir()
}: {
  brainPath: string
  homeDir?: string
}): Promise<void> {
  const geminiDir = join(homeDir, '.gemini')
  const settingsPath = join(geminiDir, 'settings.json')

  patchJsonConfig({
    configPath: settingsPath,
    configKey: 'mcpServers',
    serverEntry: {
      'ai-brain': {
        command: pythonBin(brainPath),
        args: ['-m', 'graphify.serve', graphJson(brainPath)]
      }
    }
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

export async function installAlwaysOn(): Promise<void> {
  // Skills are used instead of always-on rules
}
