import chalk from 'chalk'
import ora from 'ora'
import { cpSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { resolveBrain } from '../config.js'
import { upgradeVenv } from '../graphify.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')

export async function run(args, options = {}) {
  options ??= {}
  let resolved
try {
    resolved = resolveBrain(options.brainId || args.find(a => !a.startsWith('-')))
  } catch (e) {
    console.error(chalk.red(`  ${e.message}`))
    process.exit(1)
  }
  const { path: brainPath } = resolved

  // Read extras from brain config so upgrade preserves the installed extras
  let extras = []
  try {
    const brainCfg = JSON.parse(readFileSync(join(brainPath, '.brain-config.json'), 'utf8'))
    extras = brainCfg.extras ?? []
  } catch { /* ignore — use defaults */ }

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
