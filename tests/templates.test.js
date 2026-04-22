import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { listTemplates } = await import('../src/templates-lib.js')
const { addTemplate } = await import('../src/templates-lib.js')

test('listTemplates returns bundled and custom arrays', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
  mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
  mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
  mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
  mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

  writeFileSync(join(tmp, 'raw/templates/markdown/_bundled/book-template.md'), '# book', 'utf8')
  writeFileSync(join(tmp, 'raw/templates/markdown/_custom/my-template.md'), '# mine', 'utf8')

  const result = listTemplates(tmp)
  assert.ok(result.markdown.bundled.includes('book-template.md'))
  assert.ok(result.markdown.custom.includes('my-template.md'))

  rmSync(tmp, { recursive: true, force: true })
})

test('addTemplate creates file in _custom/ with starter content', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
  mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

  await addTemplate({ brainPath: tmp, type: 'markdown', name: 'research-interview' })

  assert.ok(existsSync(join(tmp, 'raw/templates/markdown/_custom/research-interview-template.md')))

  rmSync(tmp, { recursive: true, force: true })
})

test('addTemplate for web-clipper creates .json file in _custom/', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
  mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

  await addTemplate({ brainPath: tmp, type: 'web-clipper', name: 'podcast' })

  assert.ok(existsSync(join(tmp, 'raw/templates/web-clipper/_custom/podcast-template.json')))

  rmSync(tmp, { recursive: true, force: true })
})
