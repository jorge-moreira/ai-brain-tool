import { execa } from 'execa'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { platform } from 'process'
import { fileURLToPath } from 'url'

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

// Create .venv and install graphifyy with requested extras (always includes mcp)
export async function createVenv(brainPath, extras = []) {
  const pkg = buildPkg(extras)
  const pm = await detectPackageManager()
  if (pm === 'uv') {
    await execa('uv', ['venv', join(brainPath, '.venv')], { stdio: 'inherit' })
    await execa('uv', ['pip', 'install', pkg, '--python', venvPythonPath(brainPath)], { stdio: 'inherit' })
  } else {
    const python = await detectPython()
    if (!python) throw new Error('Python 3.10+ is required. Download from https://www.python.org/downloads/')
    await execa(python, ['-m', 'venv', join(brainPath, '.venv')], { stdio: 'inherit' })
    await execa(venvPythonPath(brainPath), ['-m', 'pip', 'install', pkg], { stdio: 'inherit' })
  }
}

// Upgrade graphifyy in existing .venv, preserving the configured extras
export async function upgradeVenv(brainPath, extras = []) {
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
        e.message.includes('No files found')) {
      console.log(chalk.yellow('\n  No code files found.'))
      console.log(chalk.dim('  For docs/articles, use the AI tool: /brain update\n'))
      return
    }
    throw e
  }
}
