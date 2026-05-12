#!/usr/bin/env node
import { program } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { run as runSetup } from './commands/setup'
import { run as runUpdate } from './commands/update'
import { run as runStatus } from './commands/status'
import { run as runTemplatesList } from './commands/templates/list'
import { run as runTemplatesAdd } from './commands/templates/add'
import { run as runUpgrade } from './commands/upgrade'
import { run as runList } from './commands/list'
import { run as runSetupObsidian } from './commands/setup-obsidian'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  version: string
}

program
  .name('ai-brain')
  .description('Your personal AI memory, connected to all your AI tools')
  .version(pkg.version, '-v, --version')

program
  .command('setup')
  .description('Run the interactive setup wizard (first-time use or new machine)')
  .option('--non-interactive', 'Install global dependencies with defaults, skip brain creation')
  .action(async (options: { nonInteractive?: boolean }) => {
    await runSetup(options)
  })

program
  .command('update')
  .description('Rebuild the knowledge graph and sync via git')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    await runUpdate([brainId].filter(Boolean), options)
  })

program
  .command('status')
  .description('Show brain health: version, graph stats, MCP connection')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    await runStatus([brainId].filter(Boolean), options)
  })

const templates = program
  .command('templates')
  .description('Manage templates (list or create custom templates)')

templates
  .command('list')
  .description('List all templates (bundled and custom)')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    await runTemplatesList([brainId].filter(Boolean), options)
  })

templates
  .command('add')
  .description('Create a new custom template from a starter files')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    await runTemplatesAdd([brainId].filter(Boolean), options)
  })

program
  .command('upgrade')
  .description('Update graphify and refresh bundled templates')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    await runUpgrade([brainId].filter(Boolean), options || {})
  })

program
  .command('list')
  .description('List all configured brains')
  .action(async () => {
    await runList()
  })

program
  .command('setup-obsidian')
  .description('Configure or update the Obsidian vault path')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .option('-u, --update', 'update existing vault configuration')
  .action(async (brainId, options: { brainId?: string; update?: boolean }) => {
    const args = [brainId].filter(Boolean)
    if (options.update) args.push('--update')
    await runSetupObsidian(args, options)
  })

program.parse()
