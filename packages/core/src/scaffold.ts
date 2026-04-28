import { mkdir, writeFile, cp } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, readFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, 'templates')

const GRAPHIFYIGNORE = `# Exclude templates and node_modules from graph indexing
raw/templates/
node_modules/
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
  'graphify-out'
]

export interface BrainConfigData {
  gitSync: boolean
  extras: string[]
  obsidianDir?: string | null
}

export function writeBrainConfig({
  brainPath,
  gitSync,
  extras = [],
  obsidianDir = null
}: {
  brainPath: string
  gitSync: boolean
  extras?: string[]
  obsidianDir?: string | null
}): void {
  const config: Record<string, unknown> = { gitSync: !!gitSync, extras }
  if (obsidianDir) config.obsidianDir = obsidianDir
  writeFileSync(join(brainPath, '.brain-config.json'), JSON.stringify(config, null, 2), 'utf8')
}

export function readLocalBrainConfig(brainPath: string): BrainConfigData {
  const configPath = join(brainPath, '.brain-config.json')
  if (!existsSync(configPath)) return { gitSync: false, extras: [], obsidianDir: null }
  return JSON.parse(readFileSync(configPath, 'utf8'))
}

export async function createBrainFolder({
  brainPath,
  includeObsidian
}: {
  brainPath: string
  includeObsidian: boolean
}): Promise<void> {
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
    await cp(join(TEMPLATES_DIR, 'obsidian'), join(brainPath, '.obsidian'), { recursive: true })
  }
}
