import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { getBrainPath } from '../config.js'
import { venvPythonPath } from '../graphify.js'

interface PackageJson {
  version: string
}

const __dirname = join(process.cwd())
const pkg: PackageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'))

export interface GraphStats {
  nodeCount: number | string
  edgeCount: number | string
}

export interface StatusResult {
  toolVersion: string
  brainPath: string
  graphify?: string
  graph?: GraphStats
}

export async function getStatus(args?: string[], options: { brainId?: string } = {}): Promise<StatusResult> {
  const brainPath = getBrainPath(args, options)

  const result: StatusResult = {
    toolVersion: pkg.version,
    brainPath,
  }

  // graphify version
  const python = venvPythonPath(brainPath)
  if (existsSync(python)) {
    try {
      const { stdout } = await execa(python, ['-m', 'graphify', '--version'])
      result.graphify = stdout.trim()
    } catch {
      result.graphify = 'error reading version'
    }
  } else {
    result.graphify = 'not installed (.venv missing)'
  }

  // Graph stats
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')
  if (existsSync(graphPath)) {
    try {
      const graph = JSON.parse(readFileSync(graphPath, 'utf8'))
      result.graph = {
        nodeCount: graph.nodes?.length ?? '?',
        edgeCount: graph.edges?.length ?? '?',
      }
    } catch {
      // Could not read graph.json
    }
  }

  return result
}
