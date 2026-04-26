import chalk from 'chalk'
import { execa } from 'execa'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { platform } from 'process'
import { fileURLToPath } from 'url'
import { homedir } from 'os'
import ora from 'ora'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Pinned version read from requirements.txt — single source of truth for Dependabot
const REQUIREMENTS = readFileSync(join(__dirname, '..', 'requirements.txt'), 'utf8')
const GRAPHIFYY_VERSION = REQUIREMENTS.match(/graphifyy\[mcp\]==(.+)/)[1].trim()

// Build the pip package specifier from a list of extras (always includes mcp)
function buildPkg(extras = []) {
  const all = ['mcp', ...extras.filter(e => e !== 'mcp')]
  return `graphifyy[${all.join(',')}]==${GRAPHIFYY_VERSION}`
}

// Returns path to the venv Python executable
export function venvPythonPath(brainPath) {
  if (platform === 'win32') {
    return join(brainPath, '.venv', 'Scripts', 'python.exe')
  }
  return join(brainPath, '.venv', 'bin', 'python3')
}

// Returns true if the .venv already exists and has the Python executable
export function venvExists(brainPath) {
  return existsSync(venvPythonPath(brainPath))
}

// Detect available Python 3.10+ binary. Returns path or null.
export async function detectPython() {
  for (const bin of ['python3', 'python']) {
    try {
      const { stdout, stderr } = await execa(bin, ['--version'])
      const versionOutput = stdout || stderr
      const match = versionOutput.match(/Python (\d+)\.(\d+)/)
      if (match && (parseInt(match[1]) > 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) >= 10))) {
        return bin
      }
    } catch {
      // not found, try next
    }
  }
  return null
}

// Detect uv (preferred) or fall back to pip
export async function detectPackageManager() {
  try {
    await execa('uv', ['--version'])
    return 'uv'
  } catch {
    return 'pip'
  }
}

// Ensure uv is installed, install if missing
export async function ensureUv() {
  try {
    await execa('uv', ['--version'])
    console.log(chalk.green('  ✓ uv already installed'))
    return
  } catch {
    // uv not found, proceed to install
  }

  const spinner = ora('Installing uv...').start()

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
      process.env.PATH = `${uvBinDir}${platform === 'win32' ? ';' : ':'}${currentPath}`
    }

    // Verify installation
    try {
      await execa('uv', ['--version'])
      spinner.succeed('uv installed')
    } catch {
      spinner.fail('uv installed but not found in PATH')
      throw new Error(
        'uv was installed but is not available in PATH.\n' +
        `Try adding ${uvBinDir} to your PATH, or restart your terminal.\n` +
        'Manual install: curl -LsSf https://astral.sh/uv/install.sh | sh'
      )
    }
  } catch (error) {
    spinner.fail('Failed to install uv')

    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNRESET')) {
      throw new Error(
        'Cannot download uv. Check your internet connection.\n' +
        'Manual install: curl -LsSf https://astral.sh/uv/install.sh | sh'
      )
    }

    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      throw new Error(
        'Permission denied installing uv.\n' +
        'Check system permissions or install manually:\n' +
        '  curl -LsSf https://astral.sh/uv/install.sh | sh'
      )
    }

    throw new Error(
      `Failed to install uv: ${error.message}\n` +
      'Manual install: curl -LsSf https://astral.sh/uv/install.sh | sh'
    )
  }
}

// Create .venv and install graphifyy with requested extras (always includes mcp)
export async function createVenv(brainPath, extras = []) {
  await ensureUv()
  
  const pkg = buildPkg(extras)
  const pm = await detectPackageManager()
  if (pm === 'uv') {
    // Check for available Python 3.10+, let uv install if needed
    const python = await detectPython()
    if (python) {
      // Use existing Python 3.10+
      await execa('uv', ['venv', '--python', python, join(brainPath, '.venv')], { stdio: 'inherit' })
    } else {
      // No Python 3.10+ found - uv will download and install latest available
      await execa('uv', ['venv', '--python', '3.10', join(brainPath, '.venv')], { stdio: 'inherit' })
    }
    await execa('uv', ['pip', 'install', pkg, '--python', venvPythonPath(brainPath)], { stdio: 'inherit' })
  } else {
    const python = await detectPython()
    if (!python) {
      throw new Error(
        'Python 3.10+ is required but not found.\n' +
        'Install with one of these options:\n' +
        '  1. uv (recommended): brew install uv && uv python install 3.10\n' +
        '  2. Python.org: https://www.python.org/downloads/'
      )
    }
    await execa(python, ['-m', 'venv', join(brainPath, '.venv')], { stdio: 'inherit' })
    await execa(venvPythonPath(brainPath), ['-m', 'pip', 'install', pkg], { stdio: 'inherit' })
  }
}

// Upgrade graphifyy in existing .venv, preserving the configured extras
export async function upgradeVenv(brainPath, extras = []) {
  await ensureUv()
  
  const pkg = buildPkg(extras)
  const pm = await detectPackageManager()
  if (pm === 'uv') {
    await execa('uv', ['pip', 'install', '--upgrade', pkg, '--python', venvPythonPath(brainPath)], { stdio: 'inherit' })
  } else {
    await execa(venvPythonPath(brainPath), ['-m', 'pip', 'install', '--upgrade', pkg], { stdio: 'inherit' })
  }
}

// Run graphify to rebuild the graph from raw/
export async function runGraphify(brainPath) {
  try {
    await execa(venvPythonPath(brainPath), ['-m', 'graphify', 'update', 'raw'], {
      stdio: 'inherit',
      cwd: brainPath,
    })
  } catch (e) {
    if (e.message.includes('No code files found') || 
        e.message.includes('Nothing to update') ||
        e.message.includes('No files found') ||
        e.exitCode === 1 && e.shortMessage?.includes('graphify update')) {
      console.log(chalk.yellow('\n  No code files found.'))
      console.log(chalk.dim('  For docs/articles, use the AI tool: /brain update\n'))
      return
    }
    throw e
  }
}
