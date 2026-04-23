import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const BRAIN_SKILL_MD = `# /brain

Your personal AI brain, powered by graphify.

## Usage

\`\`\`
/brain update              — rebuild the graph from raw/ and sync via git  (run inside brain folder)
/brain add <url>           — fetch a URL and add it to raw/                (run inside brain folder)
/brain templates           — list available templates                       (run inside brain folder)
/brain wiki                — generate agent-crawlable wiki from the graph  (run inside brain folder)
/brain obsidian            — generate Obsidian vault export from the graph (run inside brain folder)
/brain query <question>    — query the knowledge graph                     (works from anywhere)
/brain path <a> <b>        — find shortest path between two concepts        (works from anywhere)
/brain status              — show graph stats and tool version              (works from anywhere)
\`\`\`

---

## For /brain update

Use the MCP tool \`mcp__graphify__update\` (or run \`npx graphify ./raw --update\` via Bash) to rebuild the graph.

After the graph rebuilds, check the brain sync config:

\`\`\`bash
cat .brain-config.json
\`\`\`

If \`gitSync\` is \`false\` or the file does not exist, stop here — do not commit or push.

If \`gitSync\` is \`true\`, check what changed:

\`\`\`bash
git diff --stat HEAD
\`\`\`

Write a meaningful commit message based on what actually changed in \`raw/\` and \`graphify-out/\` (e.g. "brain: add 2 articles on Rust ownership, update graph"). Then commit and push:

\`\`\`bash
git add . && git commit -m "<generated message>" && git push
\`\`\`

---

## For /brain add <url>

Fetch the URL and save it as a markdown file in \`raw/\`:

\`\`\`bash
npx ai-brain add <url>
\`\`\`

Then run \`/brain update\` to rebuild the graph.

---

## For /brain templates

\`\`\`bash
npx ai-brain templates
\`\`\`

---

## For /brain wiki

Read the graphify skill at \`~/.claude/skills/graphify/SKILL.md\` and follow its instructions as if the user typed:

\`\`\`
/graphify ./raw --wiki
\`\`\`

This generates \`graphify-out/wiki/\` — an agent-crawlable index and one markdown article per community.

---

## For /brain obsidian

Check the brain config for an optional custom vault path:

\`\`\`bash
cat .brain-config.json
\`\`\`

Read the graphify skill at \`~/.claude/skills/graphify/SKILL.md\` and follow its instructions as if the user typed:

- If \`obsidianDir\` is set: \`/graphify ./raw --obsidian --obsidian-dir <obsidianDir>\`
- Otherwise: \`/graphify ./raw --obsidian\`

---

## For /brain query <question>

Use the \`ai-brain\` MCP tool \`query_graph\` with the question. Present the result as a clear human-readable answer.

---

## For /brain path <a> <b>

Use the \`ai-brain\` MCP tool \`shortest_path\` with the two concepts. Explain the path in plain language.

---

## For /brain status

\`\`\`bash
npx ai-brain status
\`\`\`
`

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

export async function installAlwaysOn({ brainPath } = {}) {
  const target = join(brainPath, 'CLAUDE.md')
  let content = existsSync(target) ? readFileSync(target, 'utf8') : ''
  if (content.includes(ALWAYS_ON_MARKER)) return
  const separator = content.trim() ? '\n\n' : ''
  writeFileSync(target, content.trimEnd() + separator + ALWAYS_ON_SECTION, 'utf8')
}

export const skillContent = BRAIN_SKILL_MD
