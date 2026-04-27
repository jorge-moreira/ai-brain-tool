import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Brain skill content - single source of truth
export const BRAIN_SKILL_MD = readFileSync(join(__dirname, 'brain-skills.md'), 'utf8')

// Build python binary path for a given brain
export function pythonBin(brainPath: string): string {
  return join(brainPath, '.venv', 'bin', 'python3')
}

// Build graph.json path for a given brain
export function graphJson(brainPath: string): string {
  return join(brainPath, 'graphify-out', 'graph.json')
}

// Patch a JSON config file with MCP server entry
// configKey: 'mcpServers' (claude/cursor/gemini) or 'mcp' (opencode)
// serverEntry: the server config object to merge in
export function patchJsonConfig({ configPath, configKey, serverEntry }: { configPath: string; configKey: string; serverEntry: Record<string, unknown> }): string {
  const dir = dirname(configPath)
  mkdirSync(dir, { recursive: true })

  let current: Record<string, unknown> = {}
  if (existsSync(configPath)) {
    try {
      current = JSON.parse(readFileSync(configPath, 'utf8'))
    } catch {
      throw new Error(`Could not parse config at ${configPath}. Please fix the JSON before running setup.`)
    }
  }

  if (!current[configKey]) {
    current[configKey] = {}
  }

  const existing = current[configKey] as Record<string, unknown>
  const merged = { ...existing, ...serverEntry }
  current[configKey] = merged
  writeFileSync(configPath, JSON.stringify(current, null, 2), 'utf8')
  return configPath
}

// Install a skill file to a directory
export function installSkillFile({ dir, filename, content }: { dir: string; filename: string; content: string }): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, filename), content, 'utf8')
}
