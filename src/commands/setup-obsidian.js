import chalk from 'chalk'
import { readConfig, readBrainConfig } from '../config.js'
import { existsSync, readFileSync, mkdirSync, cpSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')

export async function run(args, options = {}) {
  const config = readConfig()
  if (!config || !config.brainPath) {
    console.error(chalk.red('  No brain configured. Run: ai-brain setup'))
    throw new Error('NO_BRAIN_CONFIGURED')
  }
  const { brainPath } = config

  const brainConfig = readBrainConfig(brainPath)

  const currentObsidianDir = brainConfig?.obsidianDir

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

  let vaultPath = options.vaultPath ?? null
  if (vaultPath === null) {
    const { default: inquirer } = await import('inquirer')
    const result = await inquirer.prompt([
      {
        type: 'input',
        name: 'vaultPath',
        message: 'Path to your Obsidian vault:',
        default: currentObsidianDir || brainPath,
        filter: (input) => input.trim(),
      },
    ])
    vaultPath = result.vaultPath
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
}