import { existsSync, rmSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { readConfig, writeConfig } from '@ai-brain/core/config/state'
import { BrainNotFoundError, NotABrainError } from '@ai-brain/core/errors'
import {
  createBrainFolder,
  writeBrainConfig as writeBrainConfigFile
} from '@ai-brain/core/scaffold'
import { detectAll, createBrainMCP } from '@ai-brain/core/platforms'
import {
  addBrain as addBrainToConfig,
  importBrain as importBrainToConfig
} from '@ai-brain/core/config/brains'
import { initRepo, writeGitignore } from '@ai-brain/core/git'

const home = () => process.env.HOME || homedir()

const BRAIN_MARKERS = ['raw', '.graphifyignore', '.brain-config.json']

export interface CreateBrainOptions {
  name: string
  basePath: string
  includeObsidian?: boolean
  obsidianDir?: string | null
  gitSync?: boolean
  useGit?: boolean
  gitRemote?: string
}

export interface BrainOperationResult {
  success: boolean
  brainId?: string
  brainPath?: string
  error?: string
}

export function isExistingBrain(dir: string): boolean {
  return BRAIN_MARKERS.every(f => existsSync(join(dir, f)))
}

export async function createBrain(options: CreateBrainOptions): Promise<BrainOperationResult> {
  try {
    const { name, basePath, includeObsidian, obsidianDir, gitSync, useGit, gitRemote } = options

    // Create brain folder structure
    const brainPath = await createBrainFolder({
      basePath,
      name,
      includeObsidian: includeObsidian ?? false
    })

    // Write brain config
    const finalObsidianDir =
      includeObsidian && obsidianDir === ''
        ? brainPath
        : includeObsidian
          ? (obsidianDir ?? null)
          : null
    writeBrainConfigFile({ brainPath, gitSync: gitSync ?? false, obsidianDir: finalObsidianDir })

    // Setup git if requested
    if (useGit) {
      await initRepo({ brainPath, remoteUrl: gitRemote ?? '' })
      await writeGitignore({ brainPath, commitCache: true })
    }

    // Add to config
    addBrainToConfig(name, brainPath)

    // Configure MCP for configured AI tools
    const config = readConfig()
    const aiTools = config.aiTools || []
    const platforms = await detectAll(home())
    const selected = platforms.filter(p => aiTools.includes(p.key))

    if (selected.length > 0) {
      await createBrainMCP({
        configuredPlatforms: selected,
        brainPath,
        brainId: name,
        homeDir: home()
      })
    }

    return { success: true, brainId: name, brainPath }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function importBrain(path: string): Promise<BrainOperationResult> {
  try {
    if (!isExistingBrain(path)) {
      throw new NotABrainError(path, BRAIN_MARKERS)
    }

    const brainId = path.split('/').at(-1) ?? path

    // Add to config
    importBrainToConfig(path)

    // Configure MCP for configured AI tools
    const config = readConfig()
    const aiTools = config.aiTools || []
    const platforms = await detectAll(home())
    const selected = platforms.filter(p => aiTools.includes(p.key))

    if (selected.length > 0) {
      await createBrainMCP({
        configuredPlatforms: selected,
        brainPath: path,
        brainId,
        homeDir: home()
      })
    }

    return { success: true, brainId, brainPath: path }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function removeBrain(
  brainId: string,
  deleteFolder = false
): Promise<BrainOperationResult> {
  try {
    const config = readConfig()
    if (!config.brains || !config.brains[brainId]) {
      throw new BrainNotFoundError(brainId)
    }
    const brainPath = config.brains[brainId]
    const aiTools = config.aiTools || []
    const { [brainId]: _removed, ...remainingBrains } = config.brains
    config.brains = remainingBrains
    writeConfig(config)

    // Remove MCP from configured AI tools
    const homeDir = home()
    const platforms = await detectAll(homeDir)

    for (const tool of aiTools) {
      const platform = platforms.find(p => p.key === tool)
      if (platform?.module.unpatch) {
        await platform.module.unpatch({ brainId, homeDir })
      }
    }

    // Delete folder if requested
    if (deleteFolder && brainPath) {
      rmSync(brainPath, { recursive: true, force: true })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
