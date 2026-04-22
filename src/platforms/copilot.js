import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.config', 'gh'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  // Copilot CLI does not use a JSON MCP config — skill install is the integration point
}

export async function installSkill() {
  // graphify install --platform copilot handled externally for now
}
