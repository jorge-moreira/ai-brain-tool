import chalk from 'chalk'
import ora from 'ora'
import { cpSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getBrainPath } from '@ai-brain/core/config'
import { upgradeVenv } from '@ai-brain/core/graphify'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')

export async function run(args: string[], options: Record<string, unknown> = {}): Promise<void> {
  let brainPath
  try {
    brainPath = getBrainPath(args, options)
  } catch (e) {
    console.error(chalk.red(`  ${(e as Error).message}`))
    process.exit(1)
  }

  let extras: string[] = []
  try {
    const brainCfg = JSON.parse(readFileSync(join(brainPath, '.brain-config.json'), 'utf8'))
    extras = brainCfg.extras ?? []
  } catch {
    /* ignore — use defaults */
  }

  const spinnerVenv = ora('Upgrading graphify...').start()
  await upgradeVenv(brainPath, extras)
  spinnerVenv.succeed(`Graphify upgraded${extras.length ? ` [${extras.join(', ')}]` : ''}`)

  const spinnerTmpl = ora('Refreshing bundled templates...').start()

  cpSync(
    join(TEMPLATES_DIR, 'markdown', '_bundled'),
    join(brainPath, 'raw', 'templates', 'markdown', '_bundled'),
    { recursive: true, force: true }
  )
  cpSync(
    join(TEMPLATES_DIR, 'web-clipper', '_bundled'),
    join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'),
    { recursive: true, force: true }
  )

  spinnerTmpl.succeed('Bundled templates refreshed (_custom/ untouched)')
  console.log(chalk.green('\n  ✔ Upgrade complete\n'))
}
