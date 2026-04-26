import chalk from 'chalk'
import { getBrainPath } from '../config.js'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { venvPythonPath } from '../graphify.js'
import { readFileSync as rf } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(rf(join(__dirname, '../../package.json'), 'utf8'))

export async function run(args, options = {}) {
  const brainPath = getBrainPath(args, options)

  console.log('\n  ai-brain status\n')
  console.log(`  Tool version:   ${pkg.version}`)
  console.log(`  Brain path:     ${brainPath}`)

  // graphify version
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

  // Graph stats
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')
  if (existsSync(graphPath)) {
    try {
      const graph = JSON.parse(readFileSync(graphPath, 'utf8'))
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
