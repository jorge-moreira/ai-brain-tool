import chalk from 'chalk'
import { getBrainPath } from '@ai-brain/core/config'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

interface TemplateList {
  markdown: {
    bundled: string[]
    custom: string[]
  }
  webClipper: {
    bundled: string[]
    custom: string[]
  }
}

export function listTemplates(brainPath: string): TemplateList {
  const read = (dir: string) => (existsSync(dir) ? readdirSync(dir) : [])
  return {
    markdown: {
      bundled: read(join(brainPath, 'raw', 'templates', 'markdown', '_bundled')),
      custom: read(join(brainPath, 'raw', 'templates', 'markdown', '_custom'))
    },
    webClipper: {
      bundled: read(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled')),
      custom: read(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom'))
    }
  }
}

export async function run(args: string[], options: { brainId?: string } = {}): Promise<void> {
  const brainPath = getBrainPath(args, options)
  const tmpl = listTemplates(brainPath)

  console.log('\n  Markdown templates')
  console.log('  ' + '─'.repeat(54))
  console.log('  _bundled/ (tool-managed)')
  for (const f of tmpl.markdown.bundled) console.log(`  ✔ ${f}`)
  console.log('  _custom/ (yours)')
  if (tmpl.markdown.custom.length === 0) {
    console.log(chalk.dim('    (none yet — run "ai-brain templates add" to create one)'))
  } else {
    for (const f of tmpl.markdown.custom) console.log(`  ✔ ${f}`)
  }

  console.log('\n  Web Clipper templates')
  console.log('  ' + '─'.repeat(54))
  console.log('  _bundled/ (tool-managed)')
  for (const f of tmpl.webClipper.bundled) console.log(`  ✔ ${f}`)
  console.log('  _custom/ (yours)')
  if (tmpl.webClipper.custom.length === 0) {
    console.log(chalk.dim('    (none yet — run "ai-brain templates add" to create one)'))
  } else {
    for (const f of tmpl.webClipper.custom) console.log(`  ✔ ${f}`)
  }

  console.log()
  console.log('  Run "ai-brain templates add" to create a new custom template.')
  console.log('  Run "ai-brain upgrade" to update bundled templates.\n')
}
