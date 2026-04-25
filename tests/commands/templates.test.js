import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'fs'
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

vi.mock('../../src/config.js', () => ({
  readConfig: vi.fn()
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
    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue(null)

    const { run } = await import('../../src/commands/templates.js')
    
    await expect(run()).rejects.toThrow()
  })

  it('should print markdown templates section', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
    mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { run } = await import('../../src/commands/templates.js')
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

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { run } = await import('../../src/commands/templates.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('none yet')
    )

    rmSync(tmp, { recursive: true, force: true })
  })
})
