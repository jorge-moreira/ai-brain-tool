import { writeFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'

const GITIGNORE = (commitCache) => `# macOS
.DS_Store

# Node — tool installed locally for npx ai-brain commands
node_modules/

# Python environment — recreated by "ai-brain setup" on a new machine
.venv/
venv/
__pycache__/
*.pyc

# Graphify local artifacts
${commitCache ? '' : 'graphify-out/cache/\n'}graphify-out/.graphify_*
graphify-out/manifest.json
graphify-out/cost.json

# Obsidian — keep plugin config, ignore machine-specific workspace state
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
`

export async function writeGitignore({ brainPath, commitCache }) {
  writeFileSync(join(brainPath, '.gitignore'), GITIGNORE(commitCache), 'utf8')
}

export async function initRepo({ brainPath, remoteUrl }) {
  await execa('git', ['init'], { cwd: brainPath })
  if (remoteUrl) {
    await execa('git', ['remote', 'add', 'origin', remoteUrl], { cwd: brainPath })
  }
}
