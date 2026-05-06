import chalk from 'chalk'
import { getBrainPath } from '@ai-brain/core/config'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { execa } from 'execa'
import { venvPythonPath } from '@ai-brain/core/graphify'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function tryReadPkg(path: string): { version: string } | null {
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as { version: string }
}

const pkg =
  tryReadPkg(join(__dirname, '../package.json')) ??
  tryReadPkg(join(__dirname, '../../package.json'))

export async function run(args: string[], options: { brainId?: string } = {}): Promise<void> {
  const brainPath = getBrainPath(args, options)

  console.log()
  console.log(`  Tool version:   ${pkg.version}`)
  console.log(`  Brain path:    ${brainPath}`)

  const pythonPath = venvPythonPath(brainPath)
  if (existsSync(pythonPath)) {
    try {
      const { stdout } = await execa(pythonPath, ['-m', 'graphify', '--version'])
      console.log(`  Graphify:       ${stdout.trim()}`)
    } catch {
      console.log(`  Graphify:       ${chalk.yellow('error reading version')}`)
    }
  } else {
    console.log(`  Graphify:       ${chalk.red('not installed (.venv missing)')}`)
  }

  const graphPath = join(brainPath, 'graphify-out', 'graph.json')
  if (existsSync(graphPath)) {
    try {
      const graph = JSON.parse(readFileSync(graphPath, 'utf8')) as {
        nodes?: Array<unknown>
        edges?: Array<unknown>
      }
      const nodeCount = graph.nodes?.length ?? '?'
      const edgeCount = graph.edges?.length ?? '?'
      console.log(`  Graph:          ${nodeCount} nodes, ${edgeCount} edges`)
    } catch {
      console.log(`  Graph:          ${chalk.yellow('could not read graph.json')}`)
    }
  } else {
    console.log(`  Graph:          ${chalk.dim('not built yet — run: ai-brain update')}`)
  }

  console.log()
}
