import { homedir } from 'os'
import * as claude from './claude.js'
import * as opencode from './opencode.js'
import * as cursor from './cursor.js'
import * as gemini from './gemini.js'
import * as copilot from './copilot.js'
import * as codex from './codex.js'

interface PlatformModule {
  detect: (homeDir: string) => boolean
  patch: (options: { brainPath: string; homeDir: string }) => Promise<void>
  installSkill: (options: { homeDir: string }) => Promise<void>
  installAlwaysOn: (options: { brainPath: string; homeDir: string }) => Promise<void>
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

const PLATFORMS: Platform[] = [
  { name: 'Claude Code',         key: 'claude',   module: claude,   configHint: '~/.claude/' },
  { name: 'OpenCode',            key: 'opencode', module: opencode, configHint: '~/.config/opencode/' },
  { name: 'Cursor',              key: 'cursor',   module: cursor,   configHint: '~/.cursor/' },
  { name: 'Gemini CLI',          key: 'gemini',   module: gemini,   configHint: '~/.gemini/' },
  { name: 'GitHub Copilot CLI',  key: 'copilot',  module: copilot,  configHint: '~/.config/gh/' },
  { name: 'OpenAI Codex CLI',    key: 'codex',    module: codex,    configHint: '~/.codex/' },
]

export async function detectAll(homeDir: string = homedir()): Promise<DetectedPlatform[]> {
  return PLATFORMS.map(p => ({
    ...p,
    detected: p.module.detect(homeDir),
  }))
}

export interface ConfigureSelectedOptions {
  selected: DetectedPlatform[]
  brainPath: string
  homeDir?: string
}

export async function configureSelected({ selected, brainPath, homeDir = homedir() }: ConfigureSelectedOptions): Promise<void> {
  for (const platform of selected) {
    await platform.module.patch({ brainPath, homeDir })
    await platform.module.installSkill({ homeDir })
    await platform.module.installAlwaysOn({ brainPath, homeDir })
  }
}
