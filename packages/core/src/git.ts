import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { readBrainConfig } from './config'
import { GitSyncError, type GitSyncErrorCode } from './errors'

const GITIGNORE = (commitCache: boolean) => `# macOS
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

export async function writeGitignore({
  brainPath,
  commitCache
}: {
  brainPath: string
  commitCache: boolean
}): Promise<void> {
  writeFileSync(join(brainPath, '.gitignore'), GITIGNORE(commitCache), 'utf8')
}

export async function initRepo({
  brainPath,
  remoteUrl
}: {
  brainPath: string
  remoteUrl?: string
}): Promise<void> {
  await execa('git', ['init'], { cwd: brainPath })
  if (remoteUrl) {
    await execa('git', ['remote', 'add', 'origin', remoteUrl], { cwd: brainPath })
  }
}

async function getCommitMessage(brainPath: string): Promise<string> {
  const { stdout } = await execa('git', ['diff', '--stat', 'HEAD'], { cwd: brainPath })
  if (!stdout.trim()) return 'Update AI brain'

  const lines = stdout.split('\n').filter(l => l.includes('/'))
  const changes = lines
    .map(l => {
      const parts = l.split('|')
      return parts[0]?.trim().replace('raw/', '').replace('graphify-out/', '')
    })
    .filter(Boolean)
    .slice(0, 3)

  if (changes.length === 0) return 'Update AI brain'
  return `brain: update ${changes.join(', ')}`
}

export interface SyncBrainResult {
  status: 'skipped' | 'ok' | 'failed'
  error?: GitSyncError
}

function classifyGitError(e: unknown): GitSyncErrorCode {
  const stderr =
    e != null && typeof e === 'object' && 'stderr' in e
      ? String((e as { stderr: unknown }).stderr)
      : ''
  const msg = e instanceof Error ? `${e.message} ${stderr}` : String(e)

  if (
    msg.includes('does not appear to be a git repository') ||
    msg.includes('No such remote') ||
    msg.includes('No configured push destination')
  ) {
    return 'no-remote'
  }
  if (msg.includes('nothing to commit')) {
    return 'nothing-to-commit'
  }
  if (msg.includes('failed to push') || msg.includes('rejected')) {
    return 'push-failed'
  }
  return 'unknown'
}

export async function syncBrain(brainPath: string): Promise<SyncBrainResult> {
  const brainConfig = readBrainConfig(brainPath)
  const isGit = existsSync(join(brainPath, '.git'))

  if (!brainConfig.gitSync || !isGit) {
    return { status: 'skipped' }
  }

  try {
    const message = await getCommitMessage(brainPath)
    await execa('git', ['add', '.'], { cwd: brainPath })
    await execa('git', ['commit', '-m', message], { cwd: brainPath })
    await execa('git', ['push'], { cwd: brainPath })
    return { status: 'ok' }
  } catch (e) {
    const code = classifyGitError(e)
    const cause = e instanceof Error ? e : new Error(String(e))
    return { status: 'failed', error: new GitSyncError(code, cause.message, cause) }
  }
}
