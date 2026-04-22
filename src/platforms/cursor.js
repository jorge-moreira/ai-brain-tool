import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Cursor uses .cursor/rules/graphify.mdc with alwaysApply: true
const CURSOR_RULE = `---
description: ai-brain knowledge folder
alwaysApply: true
---

This is an ai-brain knowledge folder powered by graphify.

- Use \`/brain query "<question>"\` or \`/brain path "<A>" "<B>"\` to query the knowledge graph
- Use \`/brain update\` to rebuild the graph after adding notes to raw/
- Read graphify-out/GRAPH_REPORT.md for god nodes and community structure if it exists
`

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.cursor'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const cursorDir = join(homeDir, '.cursor')
  const mcpPath = join(cursorDir, 'mcp.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(cursorDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(mcpPath)) {
    try { config = JSON.parse(readFileSync(mcpPath, 'utf8')) } catch {
      throw new Error(`Could not parse existing config at ${mcpPath}. Please fix the JSON before running setup.`)
    }
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(mcpPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {}

export async function installAlwaysOn({ brainPath } = {}) {
  const rulesDir = join(brainPath, '.cursor', 'rules')
  mkdirSync(rulesDir, { recursive: true })
  const target = join(rulesDir, 'ai-brain.mdc')
  if (!existsSync(target)) {
    writeFileSync(target, CURSOR_RULE, 'utf8')
  }
}
