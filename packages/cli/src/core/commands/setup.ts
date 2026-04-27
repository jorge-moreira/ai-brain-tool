import { join, resolve, basename } from 'path'
import { existsSync, readFileSync } from 'fs'
import { createBrainFolder, writeBrainConfig } from '../scaffold.js'
import { createVenv, venvExists } from '../graphify.js'
import { detectAll, configureSelected, type DetectedPlatform } from '../platforms/index.js'
import { initRepo, writeGitignore } from '../git.js'
import { readConfig, writeConfig, addBrain, ensureConfigDir, configPath, isBrainIdAvailable, type BrainConfig } from '../config.js'

const BRAIN_MARKER = ['raw', '.graphifyignore', '.brain-config.json']

export interface SetupOptions {
  brainPath?: string
  includeObsidian?: boolean
}

export interface SetupResult {
  success: boolean
  brainPath: string
  brainId: string
  gitMode?: 'git' | 'local'
  remoteUrl?: string | null
  gitSync?: boolean
  extras: string[]
  platformKeys: string[]
  obsidianDir?: string | null
}

function isExistingBrain(dir: string): boolean {
  return BRAIN_MARKER.every(f => existsSync(join(dir, f)))
}

export async function askBrainId(defaultId: string): Promise<string> {
  while (true) {
    // In the pure function version, we return the default
    // The CLI wrapper will handle interactive prompting
    if (isBrainIdAvailable(defaultId)) {
      return defaultId
    }
    // If not available, append a number
    let counter = 1
    while (!isBrainIdAvailable(`${defaultId}${counter}`)) {
      counter++
    }
    return `${defaultId}${counter}`
  }
}

export interface FreshSetupInput {
  name: string
  baseDir: string
  gitMode: 'git' | 'local'
  remoteUrl?: string | null
  commitCache?: boolean
  gitSync?: boolean
  extras: string[]
  selectedPlatforms: DetectedPlatform[]
  obsidianChoice: 'brain' | 'separate' | 'skip'
  obsidianVaultPath?: string
}

export async function freshSetup(input: FreshSetupInput): Promise<SetupResult> {
  ensureConfigDir()
  if (!existsSync(configPath())) {
    writeConfig({ brains: {} })
  }

  let baseDir = input.baseDir
  let brainPath = join(baseDir, input.name)

  let remoteUrl: string | null = input.remoteUrl ?? null
  let gitSync = input.gitSync ?? false

  if (input.gitMode === 'git') {
    gitSync = input.gitSync ?? !!remoteUrl
  }

  // Scaffold brain folder
  await createBrainFolder({ brainPath, includeObsidian: false })
  writeBrainConfig({ brainPath, gitSync, extras: input.extras, obsidianDir: null })

  if (input.gitMode === 'git') {
    await initRepo({ brainPath, remoteUrl: remoteUrl || undefined })
    await writeGitignore({ brainPath, commitCache: input.commitCache ?? true })
  }

  await createVenv(brainPath, input.extras)

  await configureSelected({ selected: input.selectedPlatforms, brainPath })

  let obsidianDir: string | null = null

  if (input.obsidianChoice === 'brain') {
    await createBrainFolder({ brainPath, includeObsidian: true })
    obsidianDir = brainPath
  } else if (input.obsidianChoice === 'separate') {
    await createBrainFolder({ brainPath, includeObsidian: true })
    obsidianDir = input.obsidianVaultPath || null
  }

  writeBrainConfig({ brainPath, gitSync, extras: input.extras, obsidianDir })

  const brainId = await askBrainId(input.name)
  addBrain(brainId, brainPath)

  return {
    success: true,
    brainPath,
    brainId,
    gitMode: input.gitMode,
    remoteUrl,
    gitSync,
    extras: input.extras,
    platformKeys: input.selectedPlatforms.map(p => p.key),
    obsidianDir,
  }
}

export interface NewMachineSetupInput {
  brainPath: string
  selectedPlatforms: DetectedPlatform[]
}

export async function newMachineSetup(input: NewMachineSetupInput): Promise<SetupResult> {
  // Read extras from existing config
  let extras: string[] = []
  let obsidianDir: string | null = null
  try {
    const cfg = JSON.parse(readFileSync(join(input.brainPath, '.brain-config.json'), 'utf8'))
    extras = cfg.extras ?? []
    obsidianDir = cfg.obsidianDir ?? null
  } catch {
    // ignore — use defaults
  }

  await createVenv(input.brainPath, extras)

  await configureSelected({ selected: input.selectedPlatforms, brainPath: input.brainPath })

  const brainId = await askBrainId(basename(input.brainPath))
  addBrain(brainId, input.brainPath)

  return {
    success: true,
    brainPath: input.brainPath,
    brainId,
    extras,
    platformKeys: input.selectedPlatforms.map(p => p.key),
    obsidianDir,
  }
}

export async function runSetup(cwd: string = process.cwd()): Promise<SetupResult> {
  ensureConfigDir()
  if (!existsSync(configPath())) {
    writeConfig({ brains: {} })
  }

  if (isExistingBrain(cwd)) {
    const platforms = await detectAll()
    const selectedPlatforms = platforms.filter(p => p.detected)
    return newMachineSetup({ brainPath: cwd, selectedPlatforms })
  }

  // For fresh setup, the CLI wrapper needs to collect user input
  // This is a simplified version that uses defaults
  const platforms = await detectAll()
  const selectedPlatforms = platforms.filter(p => p.detected)

  return freshSetup({
    name: 'ai-brain',
    baseDir: cwd,
    gitMode: 'local',
    extras: [],
    selectedPlatforms,
    obsidianChoice: 'skip',
  })
}
