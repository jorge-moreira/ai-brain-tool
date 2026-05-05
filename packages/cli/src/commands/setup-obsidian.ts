import chalk from 'chalk'
import { resolveBrain, readBrainConfig } from '@ai-brain/core/config'
import { existsSync, mkdirSync, cpSync, writeFileSync } from 'fs'
import { join } from 'path'
import { input } from '@inquirer/prompts'
import { getPackageResource } from '@ai-brain/core/path-utils'

function getTemplatesDir(): string {
  return getPackageResource('src/templates')
}

export async function run(
  args: string[],
  options: { brainId?: string; vaultPath?: string } = {}
): Promise<void> {
  const brainId = options.brainId || (args && args.find(a => a && !a.startsWith('-')))
  let resolved
  try {
    resolved = resolveBrain(brainId)
  } catch (e) {
    console.error(chalk.red(`  ${(e as Error).message}`))
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
    console.log(
      `  Brain folder:   ${brainPath === currentObsidianDir ? '(same as brain)' : 'different'}`
    )

    const update = args.includes('--update') || args.includes('-u')
    if (!update) {
      console.log(chalk.yellow('\n  Vault already configured.'))
      console.log(`  To update, run: ${chalk.cyan('ai-brain setup-obsidian --update')}`)
      console.log()
      return
    }

    console.log(chalk.yellow('\n  Updating vault configuration...'))
  }

  let vaultPath: string | null = options.vaultPath ?? null
  if (vaultPath === null) {
    vaultPath = (
      await input({
        message: 'Path to your Obsidian vault:',
        default: currentObsidianDir || brainPath
      })
    ).trim()
  }

  const vaultDir = vaultPath || brainPath

  if (!existsSync(vaultDir)) {
    console.log(chalk.yellow(`\n  Creating vault directory: ${vaultDir}`))
    mkdirSync(vaultDir, { recursive: true })
  }

  const vaultObsidianDir = join(vaultDir, '.obsidian')
  if (!existsSync(vaultObsidianDir)) {
    mkdirSync(vaultObsidianDir, { recursive: true })
    cpSync(join(getTemplatesDir(), 'obsidian'), vaultObsidianDir, { recursive: true })
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
