import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const BRAIN_SKILL_MD = `# /brain

Interact with your ai-brain knowledge graph.

## Usage
- \`/brain update\` — rebuild the graph from raw/ and sync via git
- \`/brain status\` — show graph stats and tool version
- \`/brain query <question>\` — query the knowledge graph
- \`/brain path <concept-a> <concept-b>\` — find the shortest path between two concepts
`

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.claude'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const claudeDir = join(homeDir, '.claude')
  const mcpPath = join(claudeDir, 'mcp.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(claudeDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(mcpPath)) {
    try { config = JSON.parse(readFileSync(mcpPath, 'utf8')) } catch {
      throw new Error(`Could not parse existing config at ${mcpPath}. Please fix the JSON before running setup.`)
    }
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    type: 'stdio',
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(mcpPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.claude', 'commands')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'brain.md'), BRAIN_SKILL_MD, 'utf8')
}

export const skillContent = BRAIN_SKILL_MD
