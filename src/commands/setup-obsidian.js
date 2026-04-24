import chalk from 'chalk'
import { readConfig } from '../config.js'
import { existsSync, readFileSync, mkdirSync, cpSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')

export async function run(args) {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  const brainConfigPath = join(brainPath, '.brain-config.json')
  let brainConfig = { gitSync: false, extras: [], obsidianDir: null }

  if (existsSync(brainConfigPath)) {
    try {
      brainConfig = JSON.parse(readFileSync(brainConfigPath, 'utf8'))
    } catch {
      // use defaults
    }
  }

  const currentObsidianDir = brainConfig.obsidianDir

  console.log('\n  ai-brain setup-obsidian\n')

  if (currentObsidianDir) {
    console.log(`  Current vault:   ${currentObsidianDir}`)
    console.log(`  Brain folder:   ${brainPath === currentObsidianDir ? '(same as brain)' : 'different'}`)

    const update = args.includes('--update') || args.includes('-u')
    if (!update) {
      console.log(chalk.yellow('\n  Vault already configured.'))
      console.log(`  To update, run: ${chalk.cyan('ai-brain setup-obsidian --update')}`)
      console.log()
      return
    }

    console.log(chalk.yellow('\n  Updating vault configuration...'))
  }

  // Prompt for new path
  const inquirer = await import('inquirer')
  const { vaultPath } = await inquirer.default.prompt([
    {
      type: 'input',
      name: 'vaultPath',
      message: 'Path to your Obsidian vault:',
      default: currentObsidianDir || brainPath,
      filter: (input) => input.trim(),
    },
  ])

  const vaultDir = vaultPath || brainPath

  if (!existsSync(vaultDir)) {
    console.log(chalk.yellow(`\n  Creating vault directory: ${vaultDir}`))
    mkdirSync(vaultDir, { recursive: true })
  }

  // Copy scaffold files to vault's .obsidian/
  const vaultObsidianDir = join(vaultDir, '.obsidian')
  if (!existsSync(vaultObsidianDir)) {
    mkdirSync(vaultObsidianDir, { recursive: true })
    cpSync(join(TEMPLATES_DIR, 'obsidian'), vaultObsidianDir, { recursive: true })
    console.log(`  Copied scaffold to: ${vaultObsidianDir}`)
  } else {
    console.log(chalk.yellow(`  .obsidian/ already exists, skipping scaffold copy`))
  }

  // Update config
  brainConfig.obsidianDir = vaultDir
  const fs = await import('fs/promises')
  await fs.writeFile(brainConfigPath, JSON.stringify(brainConfig, null, 2), 'utf8')

  console.log(chalk.green('\n  ✓ Vault configured'))
  console.log(`    Vault:     ${vaultDir}`)
  console.log(`    Config:   ${brainConfigPath}`)
  console.log()
}