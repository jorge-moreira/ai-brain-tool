#!/usr/bin/env node
import { program } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { select, input, confirm } from '@inquirer/prompts'
import { getStatus } from '@ai-brain/core/commands/status'
import { runSetup } from '@ai-brain/core/commands/setup'
import { update } from '@ai-brain/core/commands/update'
import { list } from '@ai-brain/core/commands/list'
import { getBrainPath, readBrainConfig, writeBrainConfig, addBrain, ensureConfigDir, configPath, isBrainIdAvailable } from '@ai-brain/core/config'
import { createBrainFolder, writeBrainConfig as scaffoldWriteBrainConfig } from '@ai-brain/core/scaffold'
import { createVenv } from '@ai-brain/core/graphify'
import { detectAll, configureSelected, type DetectedPlatform } from '@ai-brain/core/platforms/index'
import { initRepo, writeGitignore } from '@ai-brain/core/git'
import { existsSync, mkdirSync, cpSync, writeFileSync } from 'fs'
import { execa } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'))

const TEMPLATES_DIR = join(__dirname, '..', 'templates')

program
  .name('ai-brain')
  .description('Your personal AI memory, connected to all your AI tools')
  .version(pkg.version, '-v, --version')

program
  .command('setup')
  .description('Run the interactive setup wizard (first-time use or new machine)')
  .action(async () => {
    try {
      const result = await runSetup()
      console.log(chalk.green('\n  ✓ Setup complete\n'))
      console.log(`  Brain ID:   ${result.brainId}`)
      console.log(`  Brain path: ${result.brainPath}`)
      if (result.gitMode) console.log(`  Git mode:   ${result.gitMode}`)
      if (result.platformKeys.length > 0) {
        console.log(`  Platforms:  ${result.platformKeys.join(', ')}`)
      }
      console.log()
    } catch (error: any) {
      if (error.message === 'BRAIN_NOT_RESOLVED' || error.message === 'NO_BRAIN_CONFIGURED') {
        console.error(chalk.red(`  ${error.message}`))
        process.exit(1)
      }
      throw error
    }
  })

program
  .command('update')
  .description('Rebuild the knowledge graph and sync via git')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    const spinner = ora('Running graphify...').start()
    try {
      const result = await update([brainId].filter(Boolean), options)
      spinner.succeed('Graphify complete')
      if (result.gitSynced) {
        console.log(chalk.green('  ✓ Git synced'))
      }
      console.log()
    } catch (error: any) {
      spinner.fail('Graphify failed')
      console.error(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
  })

program
  .command('status')
  .description('Show brain health: version, graph stats, MCP connection')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    try {
      const result = await getStatus([brainId].filter(Boolean), options)
      console.log()
      console.log(`  ai-brain version:  ${chalk.cyan(result.toolVersion)}`)
      console.log(`  Brain path:        ${result.brainPath}`)
      console.log(`  Graphify:          ${result.graphify}`)
      if (result.graph) {
        console.log(`  Graph nodes:       ${result.graph.nodeCount}`)
        console.log(`  Graph edges:       ${result.graph.edgeCount}`)
      }
      console.log()
    } catch (error: any) {
      console.error(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
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
    try {
      const brainPath = getBrainPath([brainId].filter(Boolean), options)
      const read = (dir: string) => existsSync(dir) ? readFileSync(dir, 'utf8') : []
      const readdirSync = (dir: string) => {
        try {
          return require('fs').readdirSync(dir)
        } catch {
          return []
        }
      }
      
      const tmpl = {
        markdown: {
          bundled: readdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled')),
          custom:  readdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom')),
        },
        webClipper: {
          bundled: readdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled')),
          custom:  readdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom')),
        },
      }

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
    } catch (error: any) {
      console.error(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
  })

templates
  .command('add')
  .description('Create a new custom template from a starter files')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    try {
      const brainPath = getBrainPath([brainId].filter(Boolean), options)
      
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

      const isMarkdown = type === 'markdown'
      const ext = isMarkdown ? '.md' : '.json'
      const subdir = isMarkdown ? 'markdown' : 'web-clipper'
      const starterFile = isMarkdown ? '_starter.md' : '_starter.json'
      const destName = `${name}-template${ext}`
      const destPath = join(brainPath, 'raw', 'templates', subdir, '_custom', destName)
      const starter = readFileSync(join(TEMPLATES_DIR, subdir, starterFile), 'utf8')
      writeFileSync(destPath, starter, 'utf8')

      console.log(chalk.green(`\n  ✔ Created ${destPath}`))
      console.log('    Open it in your editor and fill in the content.')
      console.log('    This file lives in _custom/ and will never be modified by ai-brain upgrades.\n')
    } catch (error: any) {
      console.error(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
  })

program
  .command('upgrade')
  .description('Update graphify and refresh bundled templates')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .action(async (brainId, options) => {
    try {
      const brainPath = getBrainPath([brainId].filter(Boolean), options)
      
      let extras: string[] = []
      try {
        const brainCfg = JSON.parse(readFileSync(join(brainPath, '.brain-config.json'), 'utf8'))
        extras = brainCfg.extras ?? []
      } catch { /* ignore — use defaults */ }

      const spinnerVenv = ora('Upgrading graphify...').start()
      await createVenv(brainPath, extras)
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
    } catch (error: any) {
      console.error(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
  })

program
  .command('list')
  .description('List all configured brains')
  .action(async () => {
    try {
      const result = await list()
      if (!result.hasBrains) {
        console.log(chalk.yellow('\n  No brains configured. Run: ai-brain setup\n'))
        return
      }
      console.log()
      for (const brain of result.brains) {
        console.log(`  ${chalk.cyan(brain.id)}: ${brain.path}`)
      }
      console.log()
    } catch (error: any) {
      console.error(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
  })

program
  .command('setup-obsidian')
  .description('Configure or update the Obsidian vault path')
  .argument('[brain-id]', 'Brain identifier to use')
  .option('--brain-id <id>', 'Brain identifier to use')
  .option('-u, --update', 'update existing vault configuration')
  .action(async (brainId, options) => {
    try {
      const brainIdArg = options.brainId || (brainId && !brainId.startsWith('-') ? brainId : undefined)
      let resolved
      try {
        const brainPath = getBrainPath([brainIdArg].filter(Boolean), options)
        resolved = { id: brainIdArg || '', path: brainPath }
      } catch (e: any) {
        console.error(chalk.red(`  ${e.message}`))
        throw new Error('BRAIN_NOT_RESOLVED')
      }
      const resolvedId = resolved.id
      const brainPath = resolved.path

      if (!brainPath) {
        console.error(chalk.red('  No brain configured. Run: ai-brain setup'))
        throw new Error('NO_BRAIN_CONFIGURED')
      }

      const brainConfig = readBrainConfig(brainPath)
      const currentObsidianDir = brainConfig?.obsidianDir

      console.log(`\n  ai-brain setup-obsidian${resolvedId ? ` (${resolvedId})` : ''}\n`)

      if (currentObsidianDir) {
        console.log(`  Current vault:   ${currentObsidianDir}`)
        console.log(`  Brain folder:   ${brainPath === currentObsidianDir ? '(same as brain)' : 'different'}`)

        const update = brainId === '--update' || options.update
        if (!update) {
          console.log(chalk.yellow('\n  Vault already configured.'))
          console.log(`  To update, run: ${chalk.cyan('ai-brain setup-obsidian --update')}`)
          console.log()
          return
        }

        console.log(chalk.yellow('\n  Updating vault configuration...'))
      }

      let vaultPath: string | null = null
      if (vaultPath === null) {
        const result = await input({
          message: 'Path to your Obsidian vault:',
          default: currentObsidianDir || brainPath,
        })
        vaultPath = result.trim()
      }

      const vaultDir = vaultPath || brainPath

      if (!existsSync(vaultDir)) {
        console.log(chalk.yellow(`\n  Creating vault directory: ${vaultDir}`))
        mkdirSync(vaultDir, { recursive: true })
      }

      const vaultObsidianDir = join(vaultDir, '.obsidian')
      if (!existsSync(vaultObsidianDir)) {
        mkdirSync(vaultObsidianDir, { recursive: true })
        cpSync(join(TEMPLATES_DIR, 'obsidian'), vaultObsidianDir, { recursive: true })
        console.log(`  Copied scaffold to: ${vaultObsidianDir}`)
      } else {
        console.log(chalk.yellow(`  .obsidian/ already exists, skipping scaffold copy`))
      }

      const brainConfigPath = join(brainPath, '.brain-config.json')
      const updatedConfig = { ...brainConfig, obsidianDir: vaultDir }
      writeFileSync(brainConfigPath, JSON.stringify(updatedConfig, null, 2), 'utf8')

      console.log(chalk.green('\n  ✓ Vault configured'))
      console.log(`    Vault:     ${vaultDir}`)
      console.log(`    Config:   ${brainConfigPath}`)
      console.log()
    } catch (error: any) {
      if (error.message === 'BRAIN_NOT_RESOLVED' || error.message === 'NO_BRAIN_CONFIGURED') {
        console.error(chalk.red(`  ${error.message}`))
        process.exit(1)
      }
      throw error
    }
  })

program.parse()
