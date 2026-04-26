import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    green: vi.fn((s) => s),
    cyan: vi.fn((s) => s),
    dim: vi.fn((s) => s),
    bold: { cyan: vi.fn((s) => s) }
  }
}))

vi.mock("../../../src/config.js", () => ({
  getBrainPath: vi.fn(),
  readConfig: vi.fn(),
  
}))

describe('commands/templates', () => {
  let consoleLogSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    const config = await import('../../../src/config.js')
    config.getBrainPath.mockImplementation(() => { throw new Error("No brain configured") })

    const { run } = await import('../../../src/commands/templates/list.js')
    
    await expect(run()).rejects.toThrow()
  })

  it('should print markdown templates section', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../src/commands/templates/list.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Markdown templates')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show empty custom message when no custom templates', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../src/commands/templates/list.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('none yet')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should list custom markdown templates when present', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-custom-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom/my-template.md'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../src/commands/templates/list.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('my-template.md')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should list custom web clipper templates when present', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-web-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom/web-template.html'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../src/commands/templates/list.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('web-template.html')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id as positional argument', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../src/commands/templates/list.js')
    await run(['my-brain'])

    expect(config.getBrainPath).toHaveBeenCalledWith(['my-brain'], {})

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id via --brain-id option', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../src/commands/templates/list.js')
    await run([], { brainId: 'my-brain' })

    expect(config.getBrainPath).toHaveBeenCalledWith([], { brainId: 'my-brain' })

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should exit with error when brain-id not found', async () => {
    const config = await import('../../../src/config.js')
    config.getBrainPath.mockImplementation(() => {
      throw new Error('Brain not found')
    })

    const { run } = await import('../../../src/commands/templates/list.js')
    
    await expect(run(['nonexistent'])).rejects.toThrow()
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

      const { listTemplates } = await import('../../../src/commands/templates/list.js')
      const result = listTemplates(tmp)
      expect(result.markdown.bundled).toContain('book-template.md')
      expect(result.markdown.custom).toContain('my-template.md')

      rmSync(tmp, { recursive: true, force: true })
    })
  })
})
