import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { run, listTemplates } from '../../../../src/commands/templates/list'
import { getBrainPath } from '@ai-brain/core/config'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    cyan: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    bold: { cyan: vi.fn((s: string) => s) }
  }
}))

vi.mock('@ai-brain/core/config', () => ({
  getBrainPath: vi.fn<typeof getBrainPath>()
}))

const mockedGetBrainPath = getBrainPath as Mock<typeof getBrainPath>

describe('commands/templates', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('No brain configured')
    })

    await expect(run([], {})).rejects.toThrow()
  })

  it('should print markdown templates section', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Markdown templates'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show empty custom message when no custom templates', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('none yet'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should list custom markdown templates when present', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-custom-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom/my-template.md'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('my-template.md'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should list custom web clipper templates when present', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-web-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom/web-template.html'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('web-template.html'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id as positional argument', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)

    await run(['my-brain'], {})

    expect(mockedGetBrainPath).toHaveBeenCalledWith(['my-brain'], {})

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id via --brain-id option', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], { brainId: 'my-brain' })

    expect(mockedGetBrainPath).toHaveBeenCalledWith([], { brainId: 'my-brain' })

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should exit with error when brain-id not found', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('Brain not found')
    })

    await expect(run(['nonexistent'], {})).rejects.toThrow()
  })

  describe('listTemplates helper', () => {
    it('should return bundled and custom arrays', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
      mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
      mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
      mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
      mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

      writeFileSync(join(tmp, 'raw/templates/markdown/_bundled/book-template.md'), '# book', 'utf8')
      writeFileSync(join(tmp, 'raw/templates/markdown/_custom/my-template.md'), '# mine', 'utf8')

      const result = listTemplates(tmp)
      expect(result.markdown.bundled).toContain('book-template.md')
      expect(result.markdown.custom).toContain('my-template.md')

      rmSync(tmp, { recursive: true, force: true })
    })
  })
})
