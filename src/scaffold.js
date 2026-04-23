import { mkdir, writeFile, cp } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, 'templates')

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

export function writeBrainConfig({ brainPath, gitSync, wiki = false, obsidian = false, obsidianDir = null }) {
  const config = { gitSync: !!gitSync, wiki: !!wiki, obsidian: !!obsidian }
  if (obsidianDir) config.obsidianDir = obsidianDir
  writeFileSync(join(brainPath, '.brain-config.json'), JSON.stringify(config, null, 2), 'utf8')
}

export async function createBrainFolder({ brainPath, includeObsidian }) {
  // Create all directories
  for (const dir of dirs) {
    await mkdir(join(brainPath, dir), { recursive: true })
  }

  // Write .graphifyignore — AGENTS.md/CLAUDE.md/GEMINI.md are written per-platform by installAlwaysOn()
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
