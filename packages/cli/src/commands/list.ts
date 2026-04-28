import chalk from 'chalk'
import { listBrains } from '@ai-brain/core/config'

export async function run(): Promise<void> {
  const brains = listBrains()

  if (brains.length === 0) {
    console.log(chalk.yellow('  No brains configured. Run: ai-brain setup'))
    return
  }

  console.log(chalk.bold('\n  Configured brains:\n'))

  for (const brain of brains) {
    console.log('  ' + chalk.cyan(brain.id.padEnd(12)) + ' ' + brain.path)
  }

  console.log()
}
