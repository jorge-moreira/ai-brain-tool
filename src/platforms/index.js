import { homedir } from 'os'
import * as claude from './claude.js'
import * as opencode from './opencode.js'
import * as cursor from './cursor.js'
import * as gemini from './gemini.js'
import * as copilot from './copilot.js'
import * as codex from './codex.js'

const PLATFORMS = [
  { name: 'Claude Code',         key: 'claude',   module: claude,   configHint: '~/.claude/' },
  { name: 'OpenCode',            key: 'opencode', module: opencode, configHint: '~/.config/opencode/' },
  { name: 'Cursor',              key: 'cursor',   module: cursor,   configHint: '~/.cursor/' },
  { name: 'Gemini CLI',          key: 'gemini',   module: gemini,   configHint: '~/.gemini/' },
  { name: 'GitHub Copilot CLI',  key: 'copilot',  module: copilot,  configHint: '~/.config/gh/' },
  { name: 'OpenAI Codex CLI',    key: 'codex',    module: codex,    configHint: '~/.codex/' },
]

export async function detectAll(homeDir = homedir()) {
  return PLATFORMS.map(p => ({
    ...p,
    detected: p.module.detect(homeDir),
  }))
}

export async function configureSelected({ selected, brainPath, homeDir = homedir() }) {
  for (const platform of selected) {
    await platform.module.patch({ brainPath, homeDir })
    await platform.module.installSkill({ homeDir })
    await platform.module.installAlwaysOn({ brainPath, homeDir })
  }
}
