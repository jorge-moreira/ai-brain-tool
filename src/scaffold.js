import { mkdir, writeFile, cp } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, 'templates')

const AGENTS_MD = `## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer \`graphify query "<question>"\`, \`graphify path "<A>" "<B>"\`, or \`graphify explain "<concept>"\` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run \`graphify update .\` to keep the graph current (AST-only, no API cost)
`

const GRAPHIFYIGNORE = `# Exclude templates from graph indexing
raw/templates/
`

const dirs = [
  'raw/notes',
  'raw/articles',
  'raw/projects',
  'raw/documentation',
  'raw/templates/markdown/_bundled',
  'raw/templates/markdown/_custom',
  'raw/templates/web-clipper/_bundled',
  'raw/templates/web-clipper/_custom',
  'graphify-out',
]

export async function createBrainFolder({ brainPath, includeObsidian }) {
  // Create all directories
  for (const dir of dirs) {
    await mkdir(join(brainPath, dir), { recursive: true })
  }

  // Write static files
  await writeFile(join(brainPath, 'AGENTS.md'), AGENTS_MD, 'utf8')
  await writeFile(join(brainPath, '.graphifyignore'), GRAPHIFYIGNORE, 'utf8')

  // Copy bundled markdown templates
  await cp(
    join(TEMPLATES_DIR, 'markdown', '_bundled'),
    join(brainPath, 'raw', 'templates', 'markdown', '_bundled'),
    { recursive: true }
  )

  // Copy bundled web-clipper templates
  await cp(
    join(TEMPLATES_DIR, 'web-clipper', '_bundled'),
    join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'),
    { recursive: true }
  )

  // Optionally create .obsidian/
  if (includeObsidian) {
    await mkdir(join(brainPath, '.obsidian'), { recursive: true })
    await cp(
      join(TEMPLATES_DIR, 'obsidian'),
      join(brainPath, '.obsidian'),
      { recursive: true }
    )
  }
}
