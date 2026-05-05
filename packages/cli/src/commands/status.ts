import chalk from 'chalk'
import { getBrainPath } from '@ai-brain/core/config'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { execa } from 'execa'
import { venvPythonPath } from '@ai-brain/core/graphify'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(
    existsSync(join(__dirname, '../package.json'))
      ? join(__dirname, '../package.json')
      : join(__dirname, '../../package.json'),
    'utf8'
  )
) as { version: string }

export async function run(args: string[], options: { brainId?: string } = {}): Promise<void> {
  const brainPath = getBrainPath(args, options)

  console.log('\n  ai-brain status\n')
  console.log(`  Tool version:   ${pkg.version}`)
  console.log(`  Brain path:     ${brainPath}`)

  const python = venvPythonPath(brainPath)
  if (existsSync(python)) {
    try {
      const { stdout } = await execa(python, ['-m', 'graphify', '--version'])
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
