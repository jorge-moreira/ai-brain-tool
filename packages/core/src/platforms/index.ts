import { homedir } from 'os'
import * as claude from './claude'
import * as opencode from './opencode'
import * as cursor from './cursor'
import * as gemini from './gemini'
import * as copilot from './copilot'
import * as codex from './codex'

interface PlatformModule {
  detect: (homeDir: string) => boolean
  patch: (options: { brainPath: string; brainId: string; homeDir: string }) => Promise<void>
  unpatch: (options: { brainId: string; homeDir: string }) => Promise<void>
  installSkill: (options: { homeDir: string }) => Promise<void>
}
interface Platform {
  name: string
  key: string
  module: PlatformModule
  configHint: string
}

interface DetectedPlatform extends Platform {
  detected: boolean
}

export type { DetectedPlatform }

const PLATFORMS: Platform[] = [
  { name: 'Claude Code', key: 'claude', module: claude, configHint: '~/.claude/' },
  { name: 'OpenCode', key: 'opencode', module: opencode, configHint: '~/.config/opencode/' },
  { name: 'Cursor', key: 'cursor', module: cursor, configHint: '~/.cursor/' },
  { name: 'Gemini CLI', key: 'gemini', module: gemini, configHint: '~/.gemini/' },
  { name: 'GitHub Copilot CLI', key: 'copilot', module: copilot, configHint: '~/.config/gh/' },
  { name: 'OpenAI Codex CLI', key: 'codex', module: codex, configHint: '~/.codex/' }
]

export async function detectAll(homeDir: string = homedir()): Promise<DetectedPlatform[]> {
  return PLATFORMS.map(p => ({
    ...p,
    detected: p.module.detect(homeDir)
  }))
}

export async function installSkills({
  selected,
  homeDir = homedir()
}: {
  selected: DetectedPlatform[]
  homeDir?: string
}): Promise<void> {
  for (const platform of selected) {
    await platform.module.installSkill({ homeDir })
  }
}

export async function createBrainMCP({
  configuredPlatforms,
  brainPath,
  brainId,
  homeDir = homedir()
}: {
  configuredPlatforms: DetectedPlatform[]
  brainPath: string
  brainId: string
  homeDir?: string
}): Promise<void> {
  for (const platform of configuredPlatforms) {
    await platform.module.patch({ brainPath, brainId, homeDir })
  }
}
