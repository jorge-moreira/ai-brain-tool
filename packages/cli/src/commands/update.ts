import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import { getBrainPath, readBrainConfig } from '@ai-brain/core/config'
import { runGraphify } from '@ai-brain/core/graphify'
import { existsSync } from 'fs'
import { join } from 'path'

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

export async function run(args: string[], options: { brainId?: string } = {}): Promise<void> {
  const brainId = options.brainId || (args && args.find(a => a && !a.startsWith('-')))
  const brainPath = getBrainPath(args, options)
  const brainConfig = readBrainConfig(brainPath)

  const spinner = ora(`Rebuilding knowledge graph...`).start()
  await runGraphify(brainPath)
  spinner.succeed('Knowledge graph rebuilt')

  const isGit = existsSync(join(brainPath, '.git'))
  if (brainConfig.gitSync && isGit) {
    const spinnerGit = ora('Syncing via git...').start()
    try {
      const message = await getCommitMessage(brainPath)
      await execa('git', ['add', '.'], { cwd: brainPath })
      await execa('git', ['commit', '-m', message], { cwd: brainPath })
      await execa('git', ['push'], { cwd: brainPath })
      spinnerGit.succeed('Pushed to remote')
    } catch (e) {
      spinnerGit.warn('Git sync skipped — ' + (e as Error).message)
    }
  } else if (brainConfig.gitSync && !isGit) {
    console.log(chalk.yellow('  Git sync enabled but no git repository found'))
  }

  console.log(chalk.green(`\n  ✔ Brain updated${brainId ? ` (${brainId})` : ''}\n`))
}
