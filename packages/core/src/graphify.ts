import { existsSync, readFileSync, statSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'
import { platform } from 'process'
import { homedir } from 'os'
import { execa } from 'execa'
import { GraphifyError } from '@ai-brain/core/errors'
import { getPackageResource } from '@ai-brain/core/path-utils'
import { resolveBrain } from '@ai-brain/core/config/brains'

// Global venv path (shared by all brains)
export const GLOBAL_VENV_PATH = join(homedir(), '.ai-brain-tool', '.venv')

// Check if running on Windows
export function isWindows(): boolean {
  return platform === 'win32'
}

// Get Python executable path for a venv
function getVenvPythonPath(venvPath: string): string {
  if (isWindows()) {
    return join(venvPath, 'Scripts', 'python.exe')
  }
  return join(venvPath, 'bin', 'python3')
}

// Global venv Python path
export function globalVenvPythonPath(): string {
  return getVenvPythonPath(GLOBAL_VENV_PATH)
}

// Check if global venv exists
export function globalVenvExists(): boolean {
  return existsSync(globalVenvPythonPath())
}

// Get requirements.txt - works in CLI and bundled contexts
const REQUIREMENTS_PATH = getPackageResource('requirements.txt')
const REQUIREMENTS = readFileSync(REQUIREMENTS_PATH, 'utf8')
const GRAPHIFYY_VERSION = REQUIREMENTS.match(/graphifyy\[mcp\]==(.+)/)?.[1].trim()

// Build the pip-package specifier from a list of extras (always includes mcp)
function buildPkg(extras: string[] = []): string {
  const all = ['mcp', ...extras.filter(e => e !== 'mcp')]
  return `graphifyy[${all.join(',')}]==${GRAPHIFYY_VERSION}`
}

// Returns path to the venv Python executable
export function venvPythonPath(brainPath: string): string {
  return getVenvPythonPath(join(brainPath, '.venv'))
}

// Returns true if the .venv already exists and has the Python executable
export function venvExists(brainPath: string): boolean {
  return existsSync(venvPythonPath(brainPath))
}

// Detect available Python 3.10+ binary. Returns path or null.
export async function detectPython(): Promise<string | null> {
  for (const bin of ['python3', 'python']) {
    try {
      const { stdout, stderr } = await execa(bin, ['--version'])
      const versionOutput = stdout || stderr
      const match = versionOutput.match(/Python (\d+)\.(\d+)/)
      if (
        match &&
        (parseInt(match[1]) > 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) >= 10))
      ) {
        return bin
      }
    } catch {
      // not found, try next
    }
  }
  return null
}

// Detect uv (preferred) or fall back to pip
export async function detectPackageManager(): Promise<'uv' | 'pip'> {
  try {
    await execa('uv', ['--version'])
    return 'uv'
  } catch {
    return 'pip'
  }
}

// Ensure uv is installed, install if missing
export async function ensureUv(): Promise<void> {
  try {
    await execa('uv', ['--version'])
    return
  } catch {
    // uv not found, proceed to install
  }

  try {
    const installCmd = isWindows()
      ? {
          cmd: 'powershell',
          args: ['-c', 'irm https://astral.sh/uv/install.ps1 | iex']
        }
      : {
          cmd: 'sh',
          args: ['-c', 'curl -LsSf https://astral.sh/uv/install.sh | sh']
        }

    await execa(installCmd.cmd, installCmd.args, { stdio: 'pipe' })

    // Add uv to PATH for current process (uv installs to ~/.local/bin)
    const uvBinDir = join(homedir(), '.local', 'bin')
    const currentPath = process.env.PATH || ''
    if (!currentPath.includes(uvBinDir)) {
      const sep = isWindows() ? ';' : ':'
      process.env.PATH = `${uvBinDir}${sep}${currentPath}`
    }

    // Verify installation
    try {
      await execa('uv', ['--version'])
    } catch {
      throw new Error(
        'uv was installed but is not available in PATH.\n' +
          `Try adding ${uvBinDir} to your PATH, or restart your terminal.\n` +
          'Manual install: curl -LsSf https://astral.sh/uv/install.sh | sh'
      )
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNRESET')) {
      throw new Error(
        'Cannot download uv. Check your internet connection.\n' +
          'Manual install: curl -LsSf https://astral.sh/uv/install.sh | sh'
      )
    }

    if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
      throw new Error(
        'Permission denied installing uv.\n' +
          'Check system permissions or install manually:\n' +
          '  curl -LsSf https://astral.sh/uv/install.sh | sh'
      )
    }

    throw new Error(
      `Failed to install uv: ${errorMessage}\n` +
        'Manual install: curl -LsSf https://astral.sh/uv/install.sh | sh'
    )
  }
}

async function createVenvAtPath(
  venvPath: string,
  pipTarget: string,
  extras: string[],
  options: { stdio?: 'inherit' | 'pipe' } = {}
): Promise<void> {
  const stdioMode = options.stdio ?? 'inherit'
  await ensureUv()

  const pkg = buildPkg(extras)
  const python = await detectPython()

  // Skip venv creation if python binary already exists (idempotent)
  if (!existsSync(pipTarget)) {
    if (python) {
      await execa('uv', ['venv', '--python', python, venvPath], { stdio: stdioMode })
    } else {
      await execa('uv', ['venv', '--python', '3.10', venvPath], { stdio: stdioMode })
    }
  }

  try {
    await execa('uv', ['pip', 'install', pkg, '--python', pipTarget], {
      stdio: stdioMode
    })
  } catch (e: unknown) {
    // uv exits with code 101 (Tokio runtime panic) on some ARM Linux environments
    // even after a successful install. If the python binary exists, treat as success.
    const errWithCode = e as { exitCode?: number }
    if (errWithCode.exitCode === 101 && existsSync(pipTarget)) return
    throw e
  }
}

// Create .venv and install graphifyy with requested extras (always includes mcp)
export async function createVenv(brainPath: string, extras: string[] = []): Promise<void> {
  await createVenvAtPath(join(brainPath, '.venv'), venvPythonPath(brainPath), extras)
}

// Upgrade graphifyy in existing .venv, preserving the configured extras
export async function upgradeVenv(brainPath: string, extras: string[] = []): Promise<void> {
  await ensureUv()

  const pkg = buildPkg(extras)
  await execa('uv', ['pip', 'install', '--upgrade', pkg, '--python', venvPythonPath(brainPath)], {
    stdio: 'inherit'
  })
}

// Create global .venv and install graphifyy with extras
export async function createGlobalVenv(extras: string[] = []): Promise<void> {
  await createVenvAtPath(GLOBAL_VENV_PATH, globalVenvPythonPath(), extras)
}

// Upgrade global graphifyy
export async function upgradeGlobalVenv(extras: string[] = []): Promise<void> {
  await ensureUv()
  const pkg = buildPkg(extras)
  await execa('uv', ['pip', 'install', '--upgrade', pkg, '--python', globalVenvPythonPath()], {
    stdio: 'inherit'
  })
}

export interface RunGraphifyResult {
  success: boolean
  noFilesFound?: boolean
}

// Run graphify to rebuild the graph from raw/
export async function runGraphify(brainPath: string): Promise<RunGraphifyResult> {
  try {
    await execa(globalVenvPythonPath(), ['-m', 'graphify', 'update', 'raw'], {
      stdio: 'inherit',
      cwd: brainPath
    })
    return { success: true }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    const errorWithCode = e as { exitCode?: number; shortMessage?: string }

    if (
      errorMessage.includes('No code files found') ||
      errorMessage.includes('Nothing to update') ||
      errorMessage.includes('No files found') ||
      (errorWithCode.exitCode === 1 && errorWithCode.shortMessage?.includes('graphify update'))
    ) {
      return { success: true, noFilesFound: true }
    }
    const pythonPath = globalVenvPythonPath()
    const cause = e instanceof Error ? e : new Error(String(e))
    throw new GraphifyError(
      'process-failed',
      `graphify failed: ${errorMessage}\n` +
        `Python: ${pythonPath}\n` +
        `Ensure the global venv is set up: ai-brain setup`,
      cause
    )
  }
}

// Get the total size of a brain folder in bytes
export function getBrainSize(brainPath: string): number {
  function getSize(p: string): number {
    try {
      const stats = statSync(p)
      if (stats.isFile()) {
        return stats.size
      }
      if (stats.isDirectory()) {
        const children = readdirSync(p)
        return children.reduce((total: number, child: string) => {
          return total + getSize(join(p, child))
        }, 0)
      }
      return 0
    } catch {
      return 0
    }
  }

  return getSize(brainPath)
}

export function getBrainSizeById(brainId: string): number {
  const { path } = resolveBrain(brainId)
  return getBrainSize(path)
}

// Count the number of notes (markdown files) in a brain
export function countNotes(brainPath: string): number {
  function count(p: string): number {
    try {
      const stats = statSync(p)
      if (stats.isFile()) {
        return p.endsWith('.md') ? 1 : 0
      }
      if (stats.isDirectory()) {
        // Skip .obsidian and node_modules
        if (p.includes('.obsidian') || p.includes('node_modules')) {
          return 0
        }
        const children = readdirSync(p)
        return children.reduce((total: number, child: string) => {
          return total + count(join(p, child))
        }, 0)
      }
      return 0
    } catch {
      return 0
    }
  }

  return count(brainPath)
}

export function countNotesById(brainId: string): number {
  const { path } = resolveBrain(brainId)
  return countNotes(path)
}

// Clear the graphify cache (graphify-out folder)
export function clearGraphifyCache(brainPath: string): void {
  const cachePath = join(brainPath, 'graphify-out')
  if (existsSync(cachePath)) {
    rmSync(cachePath, { recursive: true, force: true })
  }
}

export function clearGraphifyCacheById(brainId: string): void {
  const { path } = resolveBrain(brainId)
  clearGraphifyCache(path)
}
