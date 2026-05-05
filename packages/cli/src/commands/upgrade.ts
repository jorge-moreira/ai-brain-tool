import chalk from 'chalk'
import ora from 'ora'
import { cpSync } from 'fs'
import { join } from 'path'
import { getBrainPath, readConfig } from '@ai-brain/core/config'
import { upgradeVenv } from '@ai-brain/core/graphify'
import { getPackageResource } from '@ai-brain/core/path-utils'

let _templatesDir: string
function templatesDir(): string {
  if (!_templatesDir) _templatesDir = getPackageResource('src/templates')
  return _templatesDir
}

export async function run(args: string[], options: Record<string, unknown> = {}): Promise<void> {
  let brainPath
  try {
    brainPath = getBrainPath(args, options)
  } catch (e) {
    console.error(chalk.red(`  ${(e as Error).message}`))
    process.exit(1)
  }

  // Get extras from global config
  let extras: string[] = []
  try {
    const globalConfig = readConfig()
    extras = globalConfig.graphifyyExtras ?? []
  } catch {
    /* ignore — use defaults */
  }

  const spinnerVenv = ora('Upgrading graphify...').start()
  await upgradeVenv(brainPath, extras)
  spinnerVenv.succeed(`Graphify upgraded${extras.length ? ` [${extras.join(', ')}]` : ''}`)

  const spinnerTmpl = ora('Refreshing bundled templates...').start()

  cpSync(
    join(templatesDir(), 'markdown', '_bundled'),
    join(brainPath, 'raw', 'templates', 'markdown', '_bundled'),
    { recursive: true, force: true }
  )
  cpSync(
    join(templatesDir(), 'web-clipper', '_bundled'),
    join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'),
    { recursive: true, force: true }
  )

  spinnerTmpl.succeed('Bundled templates refreshed (_custom/ untouched)')
  console.log(chalk.green('\n  ✔ Upgrade complete\n'))
}
