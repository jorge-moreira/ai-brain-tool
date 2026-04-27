#!/usr/bin/env node
import { program } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

program
  .name('ai-brain')
  .description('Your personal AI memory, connected to all your AI tools')
  .version(pkg.version, '-v, --version')

program
  .command('setup')
  .description('Run the interactive setup wizard (first-time use or new machine)')
  .action(async () => { const { run } = await import('../src/commands/setup.js'); await run() })

program
  .command('update')
  .description('Rebuild the knowledge graph and sync via git')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => { const { run } = await import('../src/commands/update.js'); await run([brainId].filter(Boolean), options) })

program
  .command('status')
  .description('Show brain health: version, graph stats, MCP connection')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => { const { run } = await import('../src/commands/status.js'); await run([brainId].filter(Boolean), options) })

const templates = program
  .command('templates')
  .description('Manage templates (list or create custom templates)')

templates
  .command('list')
  .description('List all templates (bundled and custom)')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => { const { run } = await import('../src/commands/templates/list.js'); await run([brainId].filter(Boolean), options) })

templates
  .command('add')
  .description('Create a new custom template from a starter files')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => { const { run } = await import('../src/commands/templates/add.js'); await run([brainId].filter(Boolean), options) })

program
  .command('upgrade')
  .description('Update graphify and refresh bundled templates')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => { const { run } = await import('../src/commands/upgrade.js'); await run([brainId].filter(Boolean), options || {}) })

program
  .command('list')
  .description('List all configured brains')
  .action(async () => { const { run } = await import('../src/commands/list.js'); await run() })

program
  .command('setup-obsidian')
  .description('Configure or update the Obsidian vault path')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .option('-u, --update', 'update existing vault configuration')
  .action(async (brainId, options) => {
    const { run } = await import('../src/commands/setup-obsidian.js')
    const args = [brainId].filter(Boolean)
    if (options.update) args.push('--update')
    await run(args, options)
  })

program.parse()
