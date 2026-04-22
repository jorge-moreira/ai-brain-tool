import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STARTERS_DIR = join(__dirname, 'templates')

export function listTemplates(brainPath) {
  const read = (dir) => existsSync(dir) ? readdirSync(dir) : []
  return {
    markdown: {
      bundled: read(join(brainPath, 'raw', 'templates', 'markdown', '_bundled')),
      custom:  read(join(brainPath, 'raw', 'templates', 'markdown', '_custom')),
    },
    webClipper: {
      bundled: read(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled')),
      custom:  read(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom')),
    },
  }
}

export async function addTemplate({ brainPath, type, name }) {
  const isMarkdown = type === 'markdown'
  const ext = isMarkdown ? '.md' : '.json'
  const subdir = isMarkdown ? 'markdown' : 'web-clipper'
  const starterFile = isMarkdown ? '_starter.md' : '_starter.json'
  const destName = `${name}-template${ext}`
  const destPath = join(brainPath, 'raw', 'templates', subdir, '_custom', destName)
  const starter = readFileSync(join(STARTERS_DIR, subdir, starterFile), 'utf8')
  writeFileSync(destPath, starter, 'utf8')
  return destPath
}
