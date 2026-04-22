import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Copilot CLI reads skills from ~/.copilot/skills/
// No MCP config — skill is the integration point
const BRAIN_SKILL_MD = `# /brain

Interact with your ai-brain knowledge graph.

## Usage
- \`/brain update\` — rebuild the graph from raw/ and sync via git
- \`/brain status\` — show graph stats and tool version
- \`/brain query <question>\` — query the knowledge graph
- \`/brain path <concept-a> <concept-b>\` — find the shortest path between two concepts
`

// Copilot uses .github/copilot-instructions.md for always-on context
const ALWAYS_ON_SECTION = `## ai-brain

This is an ai-brain knowledge folder powered by graphify.

- Use \`/brain query "<question>"\` or \`/brain path "<A>" "<B>"\` to query the knowledge graph
- Use \`/brain update\` to rebuild the graph after adding notes to raw/
- Read graphify-out/GRAPH_REPORT.md for god nodes and community structure if it exists
`

const ALWAYS_ON_MARKER = '## ai-brain'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.config', 'gh'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  // Copilot CLI does not use a JSON MCP config
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.copilot', 'skills', 'brain')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'SKILL.md'), BRAIN_SKILL_MD, 'utf8')
}

export async function installAlwaysOn({ brainPath } = {}) {
  const githubDir = join(brainPath, '.github')
  mkdirSync(githubDir, { recursive: true })
  const target = join(githubDir, 'copilot-instructions.md')
  let content = existsSync(target) ? readFileSync(target, 'utf8') : ''
  if (content.includes(ALWAYS_ON_MARKER)) return
  const separator = content.trim() ? '\n\n' : ''
  writeFileSync(target, content.trimEnd() + separator + ALWAYS_ON_SECTION, 'utf8')
}
