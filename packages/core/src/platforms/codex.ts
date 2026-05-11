import { join } from 'path'
import { homedir } from 'os'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { pythonBin, graphJson, BRAIN_SKILL_MD, installSkillFile, unpatchJsonConfig } from './shared'

export function detect(homeDir: string = homedir()): boolean {
  return existsSync(join(homeDir, '.codex'))
}

export async function patch({
  brainPath,
  homeDir = homedir()
}: {
  brainPath: string
  homeDir?: string
}): Promise<void> {
  const codexDir = join(homeDir, '.codex')
  const configPath = join(codexDir, 'config.toml')

  mkdirSync(codexDir, { recursive: true })

  let existing = ''
  if (existsSync(configPath)) {
    existing = readFileSync(configPath, 'utf8')
  }

  // Remove existing ai-brain block if present, then append fresh
  const cleaned = existing.replace(/\[mcp_servers\.ai-brain\][^\[]*/s, '').trim()
  const entry = `\n\n[mcp_servers.ai-brain]\ncommand = "${pythonBin(brainPath)}"\nargs = ["-m", "graphify.serve", "${graphJson(brainPath)}"]\n`

  writeFileSync(configPath, cleaned + entry, 'utf8')
}

export async function installSkill({
  homeDir = homedir()
}: { homeDir?: string } = {}): Promise<void> {
  const skillDir = join(homeDir, '.codex', 'skills', 'brain')
  installSkillFile({
    dir: skillDir,
    filename: 'SKILL.md',
    content: BRAIN_SKILL_MD
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
