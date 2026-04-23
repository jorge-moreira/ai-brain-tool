import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import { readConfig } from '../config.js'
import { runGraphify } from '../graphify.js'
import { readBrainConfig } from '../scaffold.js'
import { existsSync } from 'fs'
import { join } from 'path'

async function getCommitMessage(brainPath) {
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

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  const spinner = ora('Rebuilding knowledge graph...').start()
  await runGraphify(brainPath)
  spinner.succeed('Knowledge graph rebuilt')

  const brainConfig = readBrainConfig(brainPath)
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
      spinnerGit.warn('Git sync skipped — ' + e.message)
    }
  } else if (brainConfig.gitSync && !isGit) {
    console.log(chalk.yellow('  Git sync enabled but no git repository found'))
  }

  console.log(chalk.green('\n  ✔ Brain updated\n'))
}