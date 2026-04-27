import { execa } from 'execa'
import { getBrainPath, readBrainConfig } from '../config.js'
import { runGraphify } from '../graphify.js'
import { existsSync } from 'fs'
import { join } from 'path'

async function getCommitMessage(brainPath: string): Promise<string> {
  const { stdout } = await execa('git', ['diff', '--stat', 'HEAD'], { cwd: brainPath })
  if (!stdout.trim()) return 'Update AI brain'

  const lines = stdout.split('\n').filter(l => l.includes('/'))
  const changes = lines.map(l => {
    const parts = l.split('|')
    return parts[0]?.trim().replace('raw/', '').replace('graphify-out/', '')
  }).filter(Boolean).slice(0, 3)

  if (changes.length === 0) return 'Update AI brain'
  return `brain: update ${changes.join(', ')}`
}

export interface UpdateOptions {
  brainId?: string
}

export interface UpdateResult {
  success: boolean
  brainId?: string
  gitSynced?: boolean
  message?: string
}

export async function update(args?: string[], options: UpdateOptions = {}): Promise<UpdateResult> {
  const brainId = options.brainId || (args && args.find(a => a && !a.startsWith('-')))
  const brainPath = getBrainPath(args, options)
  const brainConfig = readBrainConfig(brainPath)

  await runGraphify(brainPath)

  const isGit = existsSync(join(brainPath, '.git'))
  let gitSynced = false
  
  if (brainConfig.gitSync && isGit) {
    try {
      const message = await getCommitMessage(brainPath)
      await execa('git', ['add', '.'], { cwd: brainPath })
      await execa('git', ['commit', '-m', message], { cwd: brainPath })
      await execa('git', ['push'], { cwd: brainPath })
      gitSynced = true
    } catch {
      // Git sync failed, continue
    }
  }

  return {
    success: true,
    brainId,
    gitSynced,
  }
}
