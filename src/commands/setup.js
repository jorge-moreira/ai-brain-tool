import { input, select, checkbox, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

import { createBrainFolder, writeBrainConfig } from '../scaffold.js'
import { createVenv, venvExists } from '../graphify.js'
import { detectAll, configureSelected } from '../platforms/index.js'
import { initRepo, writeGitignore } from '../git.js'
import { writeConfig } from '../config.js'

const BRAIN_MARKER = ['raw', '.graphifyignore', '.brain-config.json']

function isExistingBrain(dir) {
  return BRAIN_MARKER.every(f => existsSync(join(dir, f)))
}

function section(label) {
  console.log(chalk.dim('\n  ─── ' + label + ' ' + '─'.repeat(Math.max(0, 40 - label.length))))
}

function item(label, value) {
  console.log(`  ${chalk.dim(label.padEnd(14))} ${value}`)
}

export async function run() {
  console.log(chalk.bold.cyan('\n  ai-brain') + chalk.bold(' setup wizard'))
  console.log(chalk.dim('  Your personal AI memory, connected to all your AI tools.\n'))

  const cwd = process.cwd()
  if (isExistingBrain(cwd)) {
    await newMachineSetup(cwd)
    return
  }

  await freshSetup()
}

async function freshSetup() {
  section('Brain location')

  const name = await input({
    message: 'Brain folder name:',
    default: 'ai-brain',
  })

  const locationChoice = await select({
    message: 'Where do you want to create it?',
    choices: [
      { name: `Current directory  (${process.cwd()})`, value: 'current' },
      { name: 'Choose a different location', value: 'custom' },
    ],
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
      { name: 'Local folder only — this machine only', value: 'local' },
    ],
  })

  let remoteUrl = null
  let commitCache = true
  let gitSync = false

  if (gitMode === 'git') {
    remoteUrl = await input({
      message: 'Git remote URL (leave blank to init locally, add remote later):',
      default: '',
    })
    remoteUrl = remoteUrl.trim() || null

    commitCache = await confirm({
      message: 'Commit extraction cache to git? (saves AI tokens on every machine — recommended)',
      default: true,
    })

    gitSync = await confirm({
      message: 'Auto-sync after /brain update? (commit + push after each graph rebuild)',
      default: !!remoteUrl,
    })
  }

  section('Scaffold')

  const spinnerScaffold = ora('Creating brain folder...').start()
  await createBrainFolder({ brainPath, includeObsidian: false })
  spinnerScaffold.succeed(`Created ${brainPath}`)

  if (gitMode === 'git') {
    const spinnerGit = ora('Initializing git repo...').start()
    await initRepo({ brainPath, remoteUrl })
    await writeGitignore({ brainPath, commitCache })
    spinnerGit.succeed('Initialized git repo')
  }

  const spinnerVenv = ora('Installing dependencies...').start()
  await createVenv(brainPath)
  spinnerVenv.succeed('Installed graphify')

  section('AI tools')

  const platforms = await detectAll()
  const platformChoices = platforms.map(p => ({
    name: `${p.name.padEnd(22)} ${p.detected ? chalk.green('detected at ' + p.configHint) : chalk.dim('not detected (you can still enable it)')}`,
    value: p,
    checked: p.detected,
  }))

  const selected = await checkbox({
    message: 'Which AI tools do you use? (space to toggle, enter to confirm)',
    choices: platformChoices,
  })

  const spinnerPlatforms = ora('Configuring AI tools...').start()
  await configureSelected({ selected, brainPath })
  spinnerPlatforms.succeed(`Configured ${selected.length} AI tool(s)`)

  section('Graph outputs')

  const wiki = await confirm({
    message: 'Generate a browsable wiki on each update? (graphify-out/wiki/ — agent-crawlable index + one article per community)',
    default: false,
  })

  section('Obsidian')

  const obsidianChoice = await select({
    message: 'Do you use Obsidian?',
    choices: [
      { name: 'Yes, use this brain folder as my Obsidian vault', value: 'brain' },
      { name: 'Yes, I have a separate Obsidian vault', value: 'separate' },
      { name: 'No / Skip', value: 'skip' },
    ],
  })

  let obsidian = false
  let obsidianDir = null

  if (obsidianChoice === 'brain') {
    obsidian = true
    const spinnerObs = ora('Configuring Obsidian...').start()
    await createBrainFolder({ brainPath, includeObsidian: true })
    spinnerObs.succeed('Configured Obsidian vault')
  } else if (obsidianChoice === 'separate') {
    obsidian = true
    obsidianDir = await input({ message: 'Path to your Obsidian vault (graphify will write the graph export there):' })
    obsidianDir = resolve(obsidianDir)
  }

  writeBrainConfig({ brainPath, gitSync, wiki, obsidian, obsidianDir })
  writeConfig({ brainPath })

  printSummary({ brainPath, gitMode, remoteUrl, gitSync, wiki, selected, obsidianChoice, obsidianDir })
}

async function newMachineSetup(brainPath) {
  console.log(chalk.yellow('\n  Existing brain detected — running new-machine setup.\n'))

  const spinnerVenv = ora('Recreating dependencies...').start()
  await createVenv(brainPath)
  spinnerVenv.succeed('Installed graphify')

  const platforms = await detectAll()
  const platformChoices = platforms.map(p => ({
    name: `${p.name.padEnd(22)} ${p.detected ? chalk.green('detected') : chalk.dim('not detected')}`,
    value: p,
    checked: p.detected,
  }))

  const selected = await checkbox({
    message: 'Which AI tools do you want to configure on this machine?',
    choices: platformChoices,
  })

  const spinnerPlatforms = ora('Configuring AI tools...').start()
  await configureSelected({ selected, brainPath })
  spinnerPlatforms.succeed(`Configured ${selected.length} AI tool(s)`)

  writeConfig({ brainPath })

  console.log(chalk.green('\n  Setup complete!'))
  item('Brain', brainPath)
  console.log(chalk.dim('\n  Restart your AI tools to connect to the brain.\n'))
}

function printSummary({ brainPath, gitMode, remoteUrl, gitSync, wiki, selected, obsidianChoice, obsidianDir }) {
  const platformNames = selected.map(p => p.name).join(', ') || 'none'
  const gitStatus = gitMode === 'git'
    ? (remoteUrl ? `git  ${chalk.dim(remoteUrl)}` : 'git  (no remote yet)')
    : 'local only'
  const syncStatus = gitMode === 'git'
    ? (gitSync ? chalk.green('enabled') : chalk.dim('disabled'))
    : chalk.dim('n/a')

  console.log(chalk.green('\n  Setup complete!\n'))

  item('Brain', chalk.cyan(brainPath))
  item('Git', gitStatus)
  item('Auto-sync', syncStatus)
  item('Wiki', wiki ? chalk.green('enabled') : chalk.dim('disabled'))
  item('Platforms', platformNames)
  if (obsidianChoice !== 'skip') item('Obsidian', obsidianDir ? chalk.cyan(obsidianDir) : 'vault in brain folder')

  console.log(chalk.dim('\n  ─── Next steps ─────────────────────────────────'))
  console.log(`  1. Restart your AI tools`)
  console.log(`  2. Drop notes into ${chalk.cyan('raw/')}`)
  console.log(`  3. Run ${chalk.cyan('/brain update')} in your AI tool`)

  if (obsidianChoice !== 'skip') {
    console.log(chalk.dim('\n  ─── Obsidian ────────────────────────────────────'))
    if (!obsidianDir) {
      console.log(`  4. Open Obsidian → Open folder → ${chalk.cyan(brainPath)}`)
      console.log(`  5. Enable the Templates plugin (already configured)`)
    } else {
      console.log(`  4. graphify will write the Obsidian graph export to ${chalk.cyan(obsidianDir)} on each update`)
    }
    console.log(`  See ${chalk.cyan('raw/templates/web-clipper/README.md')} for web clipper setup`)
  }

  console.log()
}
