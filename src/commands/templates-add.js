import { select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import { getBrainPath } from '../config.js'

export async function run(args, options = {}) {
  const brainPath = getBrainPath(args, options)

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

  const { addTemplate } = await import('../templates-lib.js')
  const destPath = await addTemplate({ brainPath, type, name })

  console.log(chalk.green(`\n  ✔ Created ${destPath}`))
  console.log('    Open it in your editor and fill in the content.')
  console.log('    This file lives in _custom/ and will never be modified by ai-brain upgrades.\n')
}
