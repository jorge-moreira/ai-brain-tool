import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { run, addTemplate } from '../../../src/commands/templates/add'

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn()
}))

describe('templates/add integration', () => {
  let tmpHome: string
  let originalHome: string | undefined
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-tmpl-add-test-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome

    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  function createBrainWithConfig(brainName: string) {
    const brainPath = join(tmpHome, brainName)
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom'), { recursive: true })

    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }),
      'utf8'
    )

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { [brainName]: brainPath } }),
      'utf8'
    )

    return { brainPath }
  }

  describe('addTemplate function', () => {
    it('should create markdown template', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      const destPath = addTemplate({
        brainPath,
        type: 'markdown',
        name: 'test-template'
      })

      expect(existsSync(destPath)).toBe(true)
      expect(destPath).toMatch(/test-template-template\.md$/)
      const content = readFileSync(destPath, 'utf8')
      expect(content).toBeDefined()
    })

    it('should create web clipper template', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      const destPath = addTemplate({
        brainPath,
        type: 'web-clipper',
        name: 'clipper-template'
      })

      expect(existsSync(destPath)).toBe(true)
      expect(destPath).toMatch(/clipper-template-template\.json$/)
      const content = readFileSync(destPath, 'utf8')
      expect(content).toBeDefined()
    })

    it('should overwrite existing template', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      const destPath = addTemplate({
        brainPath,
        type: 'markdown',
        name: 'existing'
      })

      writeFileSync(destPath, '# Old Content', 'utf8')

      addTemplate({
        brainPath,
        type: 'markdown',
        name: 'existing'
      })

      const content = readFileSync(destPath, 'utf8')
      expect(content).not.toBe('# Old Content')
    })
  })

  describe('run command', () => {
    it('should create markdown template via interactive prompt', async () => {
      const { brainPath } = createBrainWithConfig('test-brain')
      const { select, input } = await import('@inquirer/prompts')

      vi.mocked(select).mockResolvedValue('markdown')
      vi.mocked(input).mockResolvedValue('interactive-template')

      await run(['test-brain'], { brainId: 'test-brain' })

      const templatePath = join(
        brainPath,
        'raw',
        'templates',
        'markdown',
        '_custom',
        'interactive-template-template.md'
      )
      expect(existsSync(templatePath)).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Created'))
    })

    it('should create web clipper template via interactive prompt', async () => {
      const { brainPath } = createBrainWithConfig('test-brain')
      const { select, input } = await import('@inquirer/prompts')

      vi.mocked(select).mockResolvedValue('web-clipper')
      vi.mocked(input).mockResolvedValue('web-template')

      await run(['test-brain'], { brainId: 'test-brain' })

      const templatePath = join(
        brainPath,
        'raw',
        'templates',
        'web-clipper',
        '_custom',
        'web-template-template.json'
      )
      expect(existsSync(templatePath)).toBe(true)
    })

    it('should use default template name', async () => {
      const { brainPath } = createBrainWithConfig('test-brain')
      const { select, input } = await import('@inquirer/prompts')

      vi.mocked(select).mockResolvedValue('markdown')
      vi.mocked(input).mockImplementation(({ default: defaultValue }) => {
        return Promise.resolve(defaultValue || 'my-template')
      })

      await run(['test-brain'], { brainId: 'test-brain' })

      const templatePath = join(
        brainPath,
        'raw',
        'templates',
        'markdown',
        '_custom',
        'my-template-template.md'
      )
      expect(existsSync(templatePath)).toBe(true)
    })

    it('should exit with error when brain is not configured', async () => {
      writeFileSync(
        join(tmpHome, '.ai-brain-tool', 'config.json'),
        JSON.stringify({ brains: {} }),
        'utf8'
      )

      const { select } = await import('@inquirer/prompts')
      vi.mocked(select).mockResolvedValue('markdown')

      await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow()
    })
  })
})
