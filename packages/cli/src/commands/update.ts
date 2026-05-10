import chalk from 'chalk'
import ora from 'ora'
import { getBrainPath } from '@ai-brain/core/config'
import { updateBrain } from '@ai-brain/core/update'
import { GraphifyError } from '@ai-brain/core/errors'

export async function run(args: string[], options: { brainId?: string } = {}): Promise<void> {
  const brainId = options.brainId || (args && args.find(a => a && !a.startsWith('-')))
  const brainPath = getBrainPath(args, options)

  const spinner = ora('Rebuilding knowledge graph...').start()

  try {
    const result = await updateBrain(brainPath)

    spinner.succeed('Knowledge graph rebuilt')

    if (result.gitSync === 'ok') {
      ora('').succeed('Pushed to remote')
    } else if (result.gitSync === 'failed') {
      ora('').warn(`Git sync skipped — ${result.gitSyncError?.code ?? 'unknown'}`)
    }
  } catch (e) {
    if (e instanceof GraphifyError) {
      spinner.fail(`Graphify failed — ${e.code}`)
    } else {
      spinner.fail('Unexpected error — ' + (e instanceof Error ? e.message : String(e)))
    }
    throw e
  }

  console.log(chalk.green(`\n  ✔ Brain updated${brainId ? ` (${brainId})` : ''}\n`))
}
