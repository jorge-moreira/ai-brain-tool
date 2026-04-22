import chalk from 'chalk'
import ora from 'ora'
import { cpSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readConfig } from '../config.js'
import { upgradeVenv } from '../graphify.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: npx ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  const spinnerVenv = ora('Upgrading graphify...').start()
  await upgradeVenv(brainPath)
  spinnerVenv.succeed('Graphify upgraded')

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
