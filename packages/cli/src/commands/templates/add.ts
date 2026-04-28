import { select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import { getBrainPath } from '@ai-brain/core/config'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STARTERS_DIR = join(__dirname, '..', '..', 'templates')

interface AddTemplateOptions {
  brainPath: string
  type: 'markdown' | 'web-clipper'
  name: string
}

export function addTemplate({ brainPath, type, name }: AddTemplateOptions): string {
  const isMarkdown = type === 'markdown'
  const ext = isMarkdown ? '.md' : '.json'
  const subdir = isMarkdown ? 'markdown' : 'web-clipper'
  const starterFile = isMarkdown ? '_starter.md' : '_starter.json'
  const destName = `${name}-template${ext}`
  const destPath = join(brainPath, 'raw', 'templates', subdir, '_custom', destName)
  const starter = readFileSync(join(STARTERS_DIR, subdir, starterFile), 'utf8')
  writeFileSync(destPath, starter, 'utf8')
  return destPath
}

export async function run(args: string[], options: { brainId?: string } = {}): Promise<void> {
  const brainPath = getBrainPath(args, options)

  const type = await select<'markdown' | 'web-clipper'>({
    message: 'Template type:',
    choices: [
      { name: 'Markdown (for Obsidian notes)', value: 'markdown' },
      { name: 'Web Clipper (for browser clipping)', value: 'web-clipper' }
    ]
  })

  const name = await input({
    message: 'Template name:',
    default: 'my-template'
  })

  const destPath = addTemplate({ brainPath, type, name })

  console.log(chalk.green(`\n  ✔ Created ${destPath}`))
  console.log('    Open it in your editor and fill in the content.')
  console.log('    This file lives in _custom/ and will never be modified by ai-brain upgrades.\n')
}
