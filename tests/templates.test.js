import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('templates', () => {
  it('should return bundled and custom arrays for listTemplates', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    writeFileSync(join(tmp, 'raw/templates/markdown/_bundled/book-template.md'), '# book', 'utf8')
    writeFileSync(join(tmp, 'raw/templates/markdown/_custom/my-template.md'), '# mine', 'utf8')

    const { listTemplates } = await import('../src/templates-lib.js')
    const result = listTemplates(tmp)
    expect(result.markdown.bundled).toContain('book-template.md')
    expect(result.markdown.custom).toContain('my-template.md')

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should create a markdown template file in _custom/', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

    const { addTemplate } = await import('../src/templates-lib.js')
    await addTemplate({ brainPath: tmp, type: 'markdown', name: 'research-interview' })

    expect(existsSync(join(tmp, 'raw/templates/markdown/_custom/research-interview-template.md'))).toBe(true)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('should create a web-clipper template .json file in _custom/', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    const { addTemplate } = await import('../src/templates-lib.js')
    await addTemplate({ brainPath: tmp, type: 'web-clipper', name: 'podcast' })

    expect(existsSync(join(tmp, 'raw/templates/web-clipper/_custom/podcast-template.json'))).toBe(true)
    rmSync(tmp, { recursive: true, force: true })
  })
})