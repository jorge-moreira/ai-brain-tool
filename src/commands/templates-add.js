import { select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import { readConfig } from '../config.js'
import { addTemplate } from '../templates-lib.js'

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  const type = await select({
    message: 'Template type:',
    choices: [
      { name: 'Markdown (for Obsidian notes)', value: 'markdown' },
      { name: 'Web Clipper (for browser clipping)', value: 'web-clipper' },
    ],
  })

  const name = await input({
    message: 'Template name:',
    default: 'my-template',
  })

  const destPath = await addTemplate({ brainPath, type, name })

  console.log(chalk.green(`\n  ✔ Created ${destPath}`))
  console.log('    Open it in your editor and fill in the content.')
  console.log('    This file lives in _custom/ and will never be modified by ai-brain upgrades.\n')
}
