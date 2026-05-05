import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export interface BrainConfig {
  gitSync?: boolean
  extras?: string[]
  obsidianDir?: string | null
  [key: string]: unknown
}

export interface CreateBrainResult {
  brainPath: string
  tmpHome: string
  originalHome: string | undefined
}

/**
 * Creates a temporary home directory with a brain configuration.
 * Sets process.env.HOME to the temp directory so config resolution works.
 *
 * Caller must restore HOME and clean up:
 *   process.env.HOME = result.originalHome
 *   rmSync(result.tmpHome, { recursive: true, force: true })
 */
export function createBrainWithConfig(
  brainName: string,
  brainConfig: BrainConfig = {},
  extraDirs: string[] = []
): CreateBrainResult {
  const tmpHome = mkdtempSync(join(tmpdir(), `ai-brain-${brainName}-`))
  const originalHome = process.env.HOME
  process.env.HOME = tmpHome

  mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })

  const brainPath = join(tmpHome, brainName)
  mkdirSync(brainPath, { recursive: true })

  for (const dir of extraDirs) {
    mkdirSync(join(brainPath, dir), { recursive: true })
  }

  writeFileSync(
    join(brainPath, '.brain-config.json'),
    JSON.stringify({ gitSync: false, extras: [], obsidianDir: null, ...brainConfig }),
    'utf8'
  )

  writeFileSync(
    join(tmpHome, '.ai-brain-tool', 'config.json'),
    JSON.stringify({ brains: { [brainName]: brainPath } }),
    'utf8'
  )

  return { brainPath, tmpHome, originalHome }
}

/**
 * Cleans up a temporary home directory created by createBrainWithConfig.
 */
export function cleanupBrain({ tmpHome, originalHome }: CreateBrainResult): void {
  process.env.HOME = originalHome
  rmSync(tmpHome, { recursive: true, force: true })
}

/**
 * Adds a brain entry to the config.json in tmpHome.
 */
export function addBrainToConfig(tmpHome: string, brainName: string, brainPath: string): void {
  const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
  const config = existsSync(configPath)
    ? (JSON.parse(readFileSync(configPath, 'utf8')) as { brains: Record<string, string> })
    : { brains: {} }
  config.brains[brainName] = brainPath
  writeFileSync(configPath, JSON.stringify(config), 'utf8')
}
