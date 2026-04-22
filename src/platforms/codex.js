import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Codex reads AGENTS.md — same file as OpenCode
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
  return existsSync(join(homeDir, '.codex'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const codexDir = join(homeDir, '.codex')
  const configPath = join(codexDir, 'config.toml')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(codexDir, { recursive: true })

  let existing = ''
  if (existsSync(configPath)) {
    existing = readFileSync(configPath, 'utf8')
  }

  // Remove existing ai-brain block if present, then append fresh
  const cleaned = existing.replace(/\[mcp_servers\.ai-brain\][^\[]*/s, '').trim()
  const entry = `\n\n[mcp_servers.ai-brain]\ncommand = "${python}"\nargs = ["-m", "graphify.serve", "${graphPath}"]\n`

  writeFileSync(configPath, cleaned + entry, 'utf8')
}

export async function installSkill() {}

export async function installAlwaysOn({ brainPath } = {}) {
  const target = join(brainPath, 'AGENTS.md')
  let content = existsSync(target) ? readFileSync(target, 'utf8') : ''
  if (content.includes(ALWAYS_ON_MARKER)) return
  const separator = content.trim() ? '\n\n' : ''
  writeFileSync(target, content.trimEnd() + separator + ALWAYS_ON_SECTION, 'utf8')
}
