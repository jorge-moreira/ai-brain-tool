import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import { readConfig } from '../config.js'
import { runGraphify } from '../graphify.js'
import { existsSync } from 'fs'
import { join } from 'path'

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

  const isGit = existsSync(join(brainPath, '.git'))
  if (isGit) {
    const spinnerGit = ora('Syncing via git...').start()
    try {
      await execa('git', ['add', '.'], { cwd: brainPath })
      await execa('git', ['commit', '-m', 'Update AI brain'], { cwd: brainPath })
      await execa('git', ['push'], { cwd: brainPath })
      spinnerGit.succeed('Pushed to remote')
    } catch (e) {
      spinnerGit.warn('Git sync skipped — ' + e.message)
    }
  }

  console.log(chalk.green('\n  ✔ Brain updated\n'))
}
