import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Gemini CLI reads GEMINI.md
const ALWAYS_ON_SECTION = `## ai-brain

This is an ai-brain knowledge folder powered by graphify.

Rules:
- Use \`/brain query "<question>"\` or \`/brain path "<A>" "<B>"\` to query the knowledge graph
- Use \`/brain update\` to rebuild the graph after adding notes to raw/
- Use \`/brain add <url>\` to fetch and add a URL to the brain
- Read graphify-out/GRAPH_REPORT.md for god nodes and community structure if it exists
`

const ALWAYS_ON_MARKER = '## ai-brain'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.gemini'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const geminiDir = join(homeDir, '.gemini')
  const settingsPath = join(geminiDir, 'settings.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(geminiDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(settingsPath)) {
    try { config = JSON.parse(readFileSync(settingsPath, 'utf8')) } catch {
      throw new Error(`Could not parse existing config at ${settingsPath}. Please fix the JSON before running setup.`)
    }
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(settingsPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {}

export async function installAlwaysOn({ brainPath } = {}) {
  const target = join(brainPath, 'GEMINI.md')
  let content = existsSync(target) ? readFileSync(target, 'utf8') : ''
  if (content.includes(ALWAYS_ON_MARKER)) return
  const separator = content.trim() ? '\n\n' : ''
  writeFileSync(target, content.trimEnd() + separator + ALWAYS_ON_SECTION, 'utf8')
}
