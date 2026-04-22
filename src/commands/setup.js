import { input, select, checkbox, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

import { createBrainFolder } from '../scaffold.js'
import { createVenv, venvExists } from '../graphify.js'
import { detectAll, configureSelected } from '../platforms/index.js'
import { initRepo, writeGitignore } from '../git.js'
import { writeConfig } from '../config.js'

const BRAIN_MARKER = ['raw', 'AGENTS.md', '.graphifyignore']

function isExistingBrain(dir) {
  return BRAIN_MARKER.every(f => existsSync(join(dir, f)))
}

export async function run() {
  console.log(chalk.bold('\n  ╔════════════════════════════════════╗'))
  console.log(chalk.bold('  ║   ai-brain setup wizard            ║'))
  console.log(chalk.bold('  ╚════════════════════════════════════╝\n'))
  console.log('  Your personal AI memory, connected to all your AI tools.\n')

  // Detect if running inside an existing brain folder
  const cwd = process.cwd()
  if (isExistingBrain(cwd)) {
    await newMachineSetup(cwd)
    return
  }

  await freshSetup()
}

async function freshSetup() {
  // Brain folder name
  const name = await input({
    message: 'Brain folder name:',
    default: 'ai-brain',
  })

  // Location
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

  // Git mode
  const gitMode = await select({
    message: 'How do you want to manage your brain?',
    choices: [
      { name: 'Git repository (recommended) — sync across machines via git', value: 'git' },
      { name: 'Local folder only — this machine only', value: 'local' },
    ],
  })

  let remoteUrl = null
  let commitCache = true
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
  }

  // Scaffold
  const spinnerScaffold = ora('Creating brain folder...').start()
  await createBrainFolder({ brainPath, includeObsidian: false })
  spinnerScaffold.succeed(`Created ${brainPath}`)

  // Git init
  if (gitMode === 'git') {
    const spinnerGit = ora('Initializing git repo...').start()
    await initRepo({ brainPath, remoteUrl })
    await writeGitignore({ brainPath, commitCache })
    spinnerGit.succeed('Initialized git repo')
  }

  // Venv + graphify
  const spinnerVenv = ora('Installing dependencies...').start()
  await createVenv(brainPath)
  spinnerVenv.succeed('Installed graphify')

  // AI platform detection
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

  // Obsidian
  const obsidianChoice = await select({
    message: 'Do you use Obsidian?',
    choices: [
      { name: 'Yes, use this brain folder as my Obsidian vault', value: 'brain' },
      { name: 'Yes, I have a separate Obsidian vault', value: 'separate' },
      { name: 'No / Skip', value: 'skip' },
    ],
  })

  if (obsidianChoice === 'brain') {
    const spinnerObs = ora('Configuring Obsidian...').start()
    await createBrainFolder({ brainPath, includeObsidian: true })
    spinnerObs.succeed('Configured Obsidian vault')
  } else if (obsidianChoice === 'separate') {
    const vaultPath = await input({ message: 'Path to your Obsidian vault:' })
    const spinnerObs = ora('Configuring Obsidian...').start()
    await createBrainFolder({ brainPath, includeObsidian: true })
    spinnerObs.succeed(`Configured Obsidian (vault at ${vaultPath})`)
  }

  // Save brain path to global config
  writeConfig({ brainPath })

  // Summary
  printSummary({ brainPath, gitMode, remoteUrl, selected, obsidianChoice })
}

async function newMachineSetup(brainPath) {
  console.log(chalk.yellow('  Existing brain detected. Running new-machine setup...\n'))

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

  console.log(chalk.green('\n  ✔ New machine setup complete!'))
  console.log(`  Brain: ${brainPath}`)
  console.log('  Restart your AI tools to connect to the brain.\n')
}

function printSummary({ brainPath, gitMode, remoteUrl, selected, obsidianChoice }) {
  const platformNames = selected.map(p => p.name).join(', ') || 'none'
  const gitStatus = gitMode === 'git' ? (remoteUrl ? `git (${remoteUrl})` : 'git (no remote yet)') : 'local only'

  console.log(chalk.bold('\n  ╔════════════════════════════════════════════════════════╗'))
  console.log(chalk.bold('  ║   Setup complete!                                      ║'))
  console.log(chalk.bold('  ╠════════════════════════════════════════════════════════╣'))
  console.log(`  ║   Brain:      ${brainPath}`)
  console.log(`  ║   Git:        ${gitStatus}`)
  console.log(`  ║   Platforms:  ${platformNames}`)
  if (obsidianChoice !== 'skip') console.log('  ║   Obsidian:   vault configured')
  console.log(chalk.bold('  ╠════════════════════════════════════════════════════════╣'))
  console.log('  ║   Next steps:')
  console.log('  ║   1. Restart your AI tools')
  console.log(`  ║   2. Drop notes into ${brainPath}/raw/`)
  console.log('  ║   3. Run: npx ai-brain update')
  console.log('  ║      or:  /brain update  in your AI tool')
  if (obsidianChoice !== 'skip') {
    console.log('  ║')
    console.log('  ║   Obsidian:')
    console.log(`  ║   4. Open Obsidian → Open folder → ${brainPath}`)
    console.log('  ║   5. Enable: Templates plugin (already configured)')
    console.log('  ║   6. See raw/templates/web-clipper/README.md for web clipper setup')
  }
  console.log(chalk.bold('  ╚════════════════════════════════════════════════════════╝\n'))
}
