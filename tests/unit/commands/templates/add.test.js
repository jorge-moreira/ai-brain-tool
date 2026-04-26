import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs'
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

vi.mock('../../../../src/config.js', () => ({
  getBrainPath: vi.fn(),
  readConfig: vi.fn(),
  
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    readFileSync: vi.fn(() => '# Starter template'),
    writeFileSync: vi.fn(actual.writeFileSync)
  }
})

describe('commands/templates/add', () => {
  let consoleLogSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    const config = await import('../../../../src/config.js')
    config.getBrainPath.mockImplementation(() => { throw new Error("No brain configured") })

    const { run } = await import('../../../../../src/commands/templates/add.js')
    
    await expect(run()).rejects.toThrow()
  })

  it('should prompt for template type and name', async () => {
    const prompts = await import('@inquirer/prompts')
    prompts.select.mockResolvedValue('markdown')
    prompts.input.mockResolvedValue('test-template')

    const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
    mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

    const config = await import('../../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../../../src/commands/templates/add.js')
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

    const config = await import('../../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../../../src/commands/templates/add.js')
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

    const config = await import('../../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../../../src/commands/templates/add.js')
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

    const config = await import('../../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../../../src/commands/templates/add.js')
    await run([], { brainId: 'my-brain' })

    expect(config.getBrainPath).toHaveBeenCalledWith([], { brainId: 'my-brain' })

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should exit with error when brain-id not found', async () => {
    const config = await import('../../../../src/config.js')
    config.getBrainPath.mockImplementation(() => {
      throw new Error('Brain not found')
    })

    const { run } = await import('../../../../../src/commands/templates/add.js')
    
    await expect(run(['nonexistent'])).rejects.toThrow()
  })

  describe('addTemplate helper', () => {
    it('should create a markdown template file in _custom/', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
      mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

      const { addTemplate } = await import('../../../../../src/commands/templates/add.js')
      await addTemplate({ brainPath: tmp, type: 'markdown', name: 'research-interview' })

      expect(existsSync(join(tmp, 'raw/templates/markdown/_custom/research-interview-template.md'))).toBe(true)
      rmSync(tmp, { recursive: true, force: true })
    })

    it('should create a web-clipper template .json file in _custom/', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
      mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

      const { addTemplate } = await import('../../../../../src/commands/templates/add.js')
      await addTemplate({ brainPath: tmp, type: 'web-clipper', name: 'podcast' })

      expect(existsSync(join(tmp, 'raw/templates/web-clipper/_custom/podcast-template.json'))).toBe(true)
      rmSync(tmp, { recursive: true, force: true })
    })
  })
})
