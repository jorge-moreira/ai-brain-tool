import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { platform } from 'process'
import { fileURLToPath } from 'url'
import { homedir } from 'os'
import { execa } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Pinned version read from requirements.txt — single source of truth for Dependabot
const REQUIREMENTS = readFileSync(join(__dirname, '..', 'requirements.txt'), 'utf8')
const GRAPHIFYY_VERSION = REQUIREMENTS.match(/graphifyy\[mcp\]==(.+)/)?.[1].trim()

// Build the pip-package specifier from a list of extras (always includes mcp)
function buildPkg(extras: string[] = []): string {
  const all = ['mcp', ...extras.filter(e => e !== 'mcp')]
  return `graphifyy[${all.join(',')}]==${GRAPHIFYY_VERSION}`
}

// Returns path to the venv Python executable
export function venvPythonPath(brainPath: string): string {
  if (platform === 'win32') {
    return join(brainPath, '.venv', 'Scripts', 'python.exe')
  }
  return join(brainPath, '.venv', 'bin', 'python3')
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
    const isWindows = platform === 'win32'
    const installCmd = isWindows
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
      const sep = platform === 'win32' ? ';' : ':'
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

// Create .venv and install graphifyy with requested extras (always includes mcp)
export async function createVenv(brainPath: string, extras: string[] = []): Promise<void> {
  await ensureUv()

  const pkg = buildPkg(extras)
  // Check for available Python 3.10+, let uv install if needed
  const python = await detectPython()
  if (python) {
    await execa('uv', ['venv', '--python', python, join(brainPath, '.venv')], { stdio: 'inherit' })
  } else {
    await execa('uv', ['venv', '--python', '3.10', join(brainPath, '.venv')], { stdio: 'inherit' })
  }
  await execa('uv', ['pip', 'install', pkg, '--python', venvPythonPath(brainPath)], {
    stdio: 'inherit'
  })
}

// Upgrade graphifyy in existing .venv, preserving the configured extras
export async function upgradeVenv(brainPath: string, extras: string[] = []): Promise<void> {
  await ensureUv()

  const pkg = buildPkg(extras)
  await execa('uv', ['pip', 'install', '--upgrade', pkg, '--python', venvPythonPath(brainPath)], {
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
    await execa(venvPythonPath(brainPath), ['-m', 'graphify', 'update', 'raw'], {
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
    throw e
  }
}
