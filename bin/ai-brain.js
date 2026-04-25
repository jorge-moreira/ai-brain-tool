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
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (options) => { const { run } = await import('../src/commands/update.js'); await run([], options) })

program
  .command('status')
  .description('Show brain health: version, graph stats, MCP connection')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (options) => { const { run } = await import('../src/commands/status.js'); await run([], options) })

const templates = program
  .command('templates')
  .description('List all templates (bundled and custom)')
  .action(async () => { const { run } = await import('../src/commands/templates.js'); await run() })

templates
  .command('add')
  .description('Create a new custom template from a starter file')
  .action(async () => { const { run } = await import('../src/commands/templates-add.js'); await run() })

program
  .command('upgrade')
  .description('Update graphify and refresh bundled templates')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (options) => { const { run } = await import('../src/commands/upgrade.js'); await run([], options || {}) })

program
  .command('list')
  .description('List all configured brains')
  .action(async () => { const { run } = await import('../src/commands/list.js'); await run() })

program
  .command('setup-obsidian')
  .description('Configure or update the Obsidian vault path')
  .option('-u, --update', 'update existing vault configuration')
  .action(async (options) => {
    const { run } = await import('../src/commands/setup-obsidian.js')
    await run(options.update ? ['--update'] : [])
  })

program.parse()
