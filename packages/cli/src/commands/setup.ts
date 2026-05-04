import { input, select, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { join, resolve, basename } from 'path'
import { existsSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { homedir } from 'os'

import { createBrainFolder, writeBrainConfig } from '@ai-brain/core/scaffold'
import { createGlobalVenv, globalVenvExists, ensureUv } from '@ai-brain/core/graphify'
import { detectAll, type DetectedPlatform } from '@ai-brain/core/index'
import { initRepo, writeGitignore } from '@ai-brain/core/git'
import {
  writeConfig,
  addBrain,
  ensureConfigDir,
  isBrainIdAvailable,
  isInstallationComplete,
  createInitialConfig
} from '@ai-brain/core/config'

const BRAIN_MARKER = ['raw', '.graphifyignore', '.brain-config.json']

function isExistingBrain(dir: string): boolean {
  return BRAIN_MARKER.every(f => existsSync(join(dir, f)))
}

function section(label: string): void {
  console.log(chalk.dim('\n  ─── ' + label + ' ' + '─'.repeat(Math.max(0, 40 - label.length))))
}

function item(label: string, value: string): void {
  console.log(`  ${chalk.dim(label.padEnd(14))} ${value}`)
}

async function askBrainId(defaultId: string): Promise<string> {
  while (true) {
    const brainId = await input({
      message: 'Brain identifier (short name, e.g., work, personal):',
      default: defaultId
    })
    if (isBrainIdAvailable(brainId)) {
      return brainId
    }
    console.log(
      chalk.yellow(
        `  Brain identifier "${brainId}" is already taken. Please choose a different one.`
      )
    )
  }
}

export async function run(): Promise<void> {
  ensureConfigDir()

  const cwd = process.cwd()
  const isBrain = isExistingBrain(cwd)

  // Check if global installation is complete
  const installationOk = isInstallationComplete() && globalVenvExists()

  // Check uv specifically
  let uvOk = false
  try {
    execSync('uv --version', { stdio: 'ignore' })
    uvOk = true
  } catch {
    // uv not found
  }

  // If installation not complete, run it first
  if (!installationOk || !uvOk) {
    await runInstallation()
  }

  // If current folder is a brain, run new machine setup
  if (isBrain) {
    await newMachineSetup(cwd)
    return
  }

  // Otherwise run fresh setup (brain creation)
  await freshSetup()
}

async function runInstallation(): Promise<void> {
  console.log(chalk.bold.cyan('\n  ai-brain') + chalk.bold(' installation'))
  console.log(chalk.dim('  One-time setup of global dependencies.\n'))

  // Step 1: Install uv
  const spinnerUv = ora('Installing uv...').start()
  try {
    await ensureUv()
    spinnerUv.succeed('uv installed')
  } catch (error) {
    spinnerUv.fail('Failed to install uv')
    throw error
  }

  // Step 2: Prompt for extras
  console.log(chalk.dim('\nSelect graphifyy extras to install:'))
  const extras: string[] = []

  const videoAnswer = await confirm({
    message: 'Install video support? (mp4, mp3, YouTube)',
    default: false
  })
  if (videoAnswer) extras.push('video')

  const officeAnswer = await confirm({
    message: 'Install office support? (Word, Excel)',
    default: false
  })
  if (officeAnswer) extras.push('office')

  // Step 3: Create global venv
  const spinnerVenv = ora('Creating virtual environment...').start()
  try {
    await createGlobalVenv(extras)
    spinnerVenv.succeed(`graphifyy installed${extras.length ? ` [${extras.join(', ')}]` : ''}`)
  } catch (error) {
    spinnerVenv.fail('Failed to create venv')
    throw error
  }

  // Step 4: Detect AI tools
  const spinnerDetect = ora('Detecting AI tools...').start()
  const platforms = await detectAll()
  const detectedTools = platforms.filter(p => p.detected)
  const aiTools = detectedTools.map(p => p.key)
  spinnerDetect.succeed(`Found: ${aiTools.join(', ') || 'none'}`)

  // Step 5: Save config
  const config = createInitialConfig()
  config.installationComplete = true
  config.graphifyyExtras = extras
  config.aiTools = aiTools
  writeConfig(config)

  console.log(chalk.green('\n✅ Installation complete!\n'))
}

async function freshSetup(): Promise<void> {
  console.log(chalk.bold('\n  Brain setup'))
  console.log(chalk.dim('  Create and configure your brain.\n'))

  section('Brain location')

  const name = await input({
    message: 'Brain folder name:',
    default: 'ai-brain'
  })

  const locationChoice = await select({
    message: 'Where do you want to create it?',
    choices: [
      { name: `Current directory  (${process.cwd()})`, value: 'current' },
      { name: 'Choose a different location', value: 'custom' }
    ]
  })

  let baseDir = process.cwd()
  if (locationChoice === 'custom') {
    const customPath = await input({ message: 'Path:' })
    baseDir = resolve(customPath)
  }

  const brainPath = join(baseDir, name)

  section('Git')

  const gitMode = await select({
    message: 'How do you want to manage your brain?',
    choices: [
      { name: 'Git repository (recommended) — sync across machines via git', value: 'git' },
      { name: 'Local folder only — this machine only', value: 'local' }
    ]
  })

  let remoteUrl: string | null = null
  let commitCache = true
  let gitSync = false

  if (gitMode === 'git') {
    remoteUrl = await input({
      message: 'Git remote URL (leave blank to init locally, add remote later):',
      default: ''
    })
    remoteUrl = remoteUrl.trim() || null

    commitCache = await confirm({
      message: 'Commit extraction cache to git? (saves AI tokens on every machine — recommended)',
      default: true
    })

    gitSync = await confirm({
      message: 'Auto-sync after /brain update? (commit + push after each graph rebuild)',
      default: !!remoteUrl
    })
  }

  section('Scaffold')

  let obsidianDir: string | null = null

  const spinnerScaffold = ora('Creating brain folder...').start()
  await createBrainFolder({ brainPath, includeObsidian: false })
  writeBrainConfig({ brainPath, gitSync, obsidianDir })
  spinnerScaffold.succeed(`Created ${brainPath}`)

  if (gitMode === 'git') {
    const spinnerGit = ora('Initializing git repo...').start()
    await initRepo({ brainPath, remoteUrl: remoteUrl ?? undefined })
    await writeGitignore({ brainPath, commitCache })
    spinnerGit.succeed('Initialized git repo')
  }

  section('AI tools')

  // Get pre-configured AI tools from installation
  const configPath = join(homedir(), '.ai-brain-tool', 'config.json')
  let aiTools: string[] = []
  const platforms = await detectAll()
  const selected = platforms.filter(p => p.detected)
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as { aiTools?: string[] }
    aiTools = config.aiTools || []
  } catch {
    // Fallback: use detected tools
    aiTools = selected.map(p => p.key)
  }

  if (aiTools.length === 0) {
    console.log(chalk.yellow('\n  No AI tools detected during installation.'))
    console.log(chalk.dim('  You can configure AI tools later with: ai-brain setup\n'))
  } else {
    console.log(chalk.green(`\n  Found AI tools: ${aiTools.join(', ')}\n`))
  }

  section('Obsidian')

  const obsidianChoice = await select({
    message: 'Do you use Obsidian?',
    choices: [
      { name: 'Yes, use this brain folder as my Obsidian vault', value: 'brain' },
      { name: 'Yes, I have a separate Obsidian vault', value: 'separate' },
      { name: 'No / Skip', value: 'skip' }
    ]
  })

  if (obsidianChoice === 'brain') {
    const spinnerObs = ora('Configuring Obsidian...').start()
    await createBrainFolder({ brainPath, includeObsidian: true })
    obsidianDir = brainPath
    spinnerObs.succeed('Configured Obsidian vault')
  } else if (obsidianChoice === 'separate') {
    const vaultPath = await input({ message: 'Path to your Obsidian vault:' })
    const spinnerObs = ora('Configuring Obsidian...').start()
    await createBrainFolder({ brainPath, includeObsidian: true })
    obsidianDir = vaultPath
    spinnerObs.succeed(`Configured Obsidian (vault at ${vaultPath})`)
  }

  writeBrainConfig({ brainPath, gitSync, obsidianDir })

  const brainId = await askBrainId(name)

  addBrain(brainId, brainPath)

  printSummary({
    brainPath,
    gitMode,
    remoteUrl,
    gitSync,
    extras: [],
    selected,
    obsidianChoice: obsidianChoice ?? 'skip',
    aiTools
  })

  console.log(chalk.green('\n  Installation complete!\n'))
}

async function newMachineSetup(brainPath: string): Promise<void> {
  console.log(chalk.yellow('\n  Existing brain detected — running new-machine setup.\n'))

  // Check if installation is complete
  const installationOk = isInstallationComplete() && globalVenvExists()
  let uvOk = false
  try {
    execSync('uv --version', { stdio: 'ignore' })
    uvOk = true
  } catch {
    // uv not found
  }

  // If installation not complete, run it first
  if (!installationOk || !uvOk) {
    await runInstallation()
  }

  section('AI tools')

  // Get pre-configured AI tools from installation
  const configPath = join(homedir(), '.ai-brain-tool', 'config.json')
  let aiTools: string[] = []
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as { aiTools?: string[] }
    aiTools = config.aiTools || []
  } catch {
    // Fallback: detect again
    const platforms = await detectAll()
    aiTools = platforms.filter(p => p.detected).map(p => p.key)
  }

  if (aiTools.length === 0) {
    console.log(chalk.yellow('\n  No AI tools detected during installation.'))
    console.log(chalk.dim('  You can configure AI tools manually later.\n'))
  } else {
    console.log(chalk.green(`\n  Found AI tools: ${aiTools.join(', ')}\n`))
  }

  const brainId = await askBrainId(basename(brainPath))

  addBrain(brainId, brainPath)

  console.log(chalk.green('\n  Setup complete!'))
  item('Brain', brainPath)
  console.log(chalk.dim('\n  Restart your AI tools to connect to the brain.\n'))
}

interface PrintSummaryOptions {
  brainPath: string
  gitMode: string
  remoteUrl: string | null
  gitSync: boolean
  extras: string[]
  selected: DetectedPlatform[]
  obsidianChoice: string
  aiTools: string[]
}

function printSummary({
  brainPath,
  gitMode,
  remoteUrl,
  gitSync,
  extras,
  selected,
  obsidianChoice
}: PrintSummaryOptions): void {
  const platformNames = selected.map(p => p.name).join(', ') || 'none'
  const gitStatus =
    gitMode === 'git'
      ? remoteUrl
        ? `git  ${chalk.dim(remoteUrl)}`
        : 'git  (no remote yet)'
      : 'local only'
  const syncStatus =
    gitMode === 'git'
      ? gitSync
        ? chalk.green('enabled')
        : chalk.dim('disabled')
      : chalk.dim('n/a')

  console.log(chalk.green('\n  Setup complete!\n'))

  item('Brain', chalk.cyan(brainPath))
  item('Git', gitStatus)
  item('Auto-sync', syncStatus)
  item('Graphify', extras.length ? `mcp, ${extras.join(', ')}` : 'mcp')
  item('Platforms', platformNames)
  if (obsidianChoice !== 'skip') item('Obsidian', 'vault configured')

  console.log(chalk.dim('\n  ─── Next steps ─────────────────────────────────'))
  console.log(`  1. Restart your AI tools`)
  console.log(`  2. Drop notes into ${chalk.cyan('raw/')}`)
  console.log(`  3. Run ${chalk.cyan('/brain update')} in your AI tool`)

  if (obsidianChoice !== 'skip') {
    console.log(chalk.dim('\n  ─── Obsidian ────────────────────────────────────'))
    console.log(`  4. Open Obsidian → Open folder → ${chalk.cyan(brainPath)}`)
    console.log(`  5. Enable the Templates plugin (already configured)`)
    console.log(
      `  6. See ${chalk.cyan('raw/templates/web-clipper/README.md')} for web clipper setup`
    )
  }

  console.log()
}
