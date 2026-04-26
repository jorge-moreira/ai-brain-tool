import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    green: vi.fn((s) => s)
  }
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn()
}))

vi.mock("../../src/config.js", () => ({
  getBrainPath: vi.fn(),
  readConfig: vi.fn(),
  
}))

vi.mock('../../src/templates-lib.js', () => ({
  addTemplate: vi.fn()
}))

describe('commands/templates-add', () => {
  let consoleLogSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    const config = await import('../../src/config.js')
    config.getBrainPath.mockImplementation(() => { throw new Error("No brain configured") })

    const { run } = await import('../../src/commands/templates-add.js')
    
    await expect(run()).rejects.toThrow()
  })

  it('should prompt for template type and name', async () => {
    const prompts = await import('@inquirer/prompts')
    prompts.select.mockResolvedValue('markdown')
    prompts.input.mockResolvedValue('test-template')

    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

    const config = await import('../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const templatesLib = await import('../../src/templates-lib.js')
    templatesLib.addTemplate.mockResolvedValue(join(tmp, 'raw/templates/markdown/_custom/test-template.md'))

    const { run } = await import('../../src/commands/templates-add.js')
    await run()

    expect(prompts.select).toHaveBeenCalled()
    expect(prompts.input).toHaveBeenCalled()

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should print success message with created path', async () => {
    const prompts = await import('@inquirer/prompts')
    prompts.select.mockResolvedValue('markdown')
    prompts.input.mockResolvedValue('test-template')

    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

    const config = await import('../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const templatesLib = await import('../../src/templates-lib.js')
    const destPath = join(tmp, 'raw/templates/markdown/_custom/test-template.md')
    templatesLib.addTemplate.mockResolvedValue(destPath)

    const { run } = await import('../../src/commands/templates-add.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Created')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id as positional argument', async () => {
    const prompts = await import('@inquirer/prompts')
    prompts.select.mockResolvedValue('markdown')
    prompts.input.mockResolvedValue('test-template')

    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

    const config = await import('../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const templatesLib = await import('../../src/templates-lib.js')
    templatesLib.addTemplate.mockResolvedValue(join(tmp, 'raw/templates/markdown/_custom/test-template.md'))

    const { run } = await import('../../src/commands/templates-add.js')
    await run(['my-brain'])

    expect(config.getBrainPath).toHaveBeenCalledWith(['my-brain'], {})

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id via --brain-id option', async () => {
    const prompts = await import('@inquirer/prompts')
    prompts.select.mockResolvedValue('markdown')
    prompts.input.mockResolvedValue('test-template')

    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

    const config = await import('../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const templatesLib = await import('../../src/templates-lib.js')
    templatesLib.addTemplate.mockResolvedValue(join(tmp, 'raw/templates/markdown/_custom/test-template.md'))

    const { run } = await import('../../src/commands/templates-add.js')
    await run([], { brainId: 'my-brain' })

    expect(config.getBrainPath).toHaveBeenCalledWith([], { brainId: 'my-brain' })

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should exit with error when brain-id not found', async () => {
    const config = await import('../../src/config.js')
    config.getBrainPath.mockImplementation(() => {
      throw new Error('Brain not found')
    })

    const { run } = await import('../../src/commands/templates-add.js')
    
    await expect(run(['nonexistent'])).rejects.toThrow()
  })
})
