import { execa } from 'execa'
import { existsSync } from 'fs'
import { join } from 'path'
import { platform } from 'process'

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

// Pinned version installed on setup — bump this when a new release is vetted
const GRAPHIFYY_VERSION = '0.4.29'

// Create .venv and install graphify[mcp]
export async function createVenv(brainPath) {
  const pkg = `graphifyy[mcp]==${GRAPHIFYY_VERSION}`
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

// Upgrade graphify[mcp] in existing .venv
export async function upgradeVenv(brainPath) {
  const pm = await detectPackageManager()
  if (pm === 'uv') {
    await execa('uv', ['pip', 'install', '--upgrade', 'graphifyy[mcp]', '--python', venvPythonPath(brainPath)], { stdio: 'inherit' })
  } else {
    await execa(venvPythonPath(brainPath), ['-m', 'pip', 'install', '--upgrade', 'graphifyy[mcp]'], { stdio: 'inherit' })
  }
}

// Run graphify to rebuild the graph from raw/
// Options:
//   wiki        {boolean} — also generate graphify-out/wiki/
//   obsidian    {boolean} — also generate Obsidian vault inside brain folder
//   obsidianDir {string}  — write Obsidian vault to a custom directory instead
export async function runGraphify(brainPath, { wiki = false, obsidian = false, obsidianDir = null } = {}) {
  const args = ['-m', 'graphify', join(brainPath, 'raw'), '--update']
  if (wiki) args.push('--wiki')
  if (obsidian || obsidianDir) {
    args.push('--obsidian')
    if (obsidianDir) args.push('--obsidian-dir', obsidianDir)
  }
  await execa(venvPythonPath(brainPath), args, {
    stdio: 'inherit',
    cwd: brainPath,
  })
}
