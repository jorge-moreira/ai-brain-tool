import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { run, addTemplate } from '../../../../src/commands/templates/add'
import { createBrainWithConfig, cleanupBrain } from '../../../helpers'

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn()
}))

describe('templates/add integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createBrainWithTemplates(name: string) {
    return createBrainWithConfig(name, {}, [
      'raw/templates/markdown/_custom',
      'raw/templates/web-clipper/_custom'
    ])
  }

  describe('addTemplate function', () => {
    it('should create markdown template', () => {
      const result = createBrainWithTemplates('test-brain')

      const destPath = addTemplate({
        brainPath: result.brainPath,
        type: 'markdown',
        name: 'test-template'
      })

      expect(existsSync(destPath)).toBe(true)
      expect(destPath).toMatch(/test-template-template\.md$/)
      const content = readFileSync(destPath, 'utf8')
      expect(content).toBeDefined()
      cleanupBrain(result)
    })

    it('should create web clipper template', () => {
      const result = createBrainWithTemplates('test-brain')

      const destPath = addTemplate({
        brainPath: result.brainPath,
        type: 'web-clipper',
        name: 'clipper-template'
      })

      expect(existsSync(destPath)).toBe(true)
      expect(destPath).toMatch(/clipper-template-template\.json$/)
      const content = readFileSync(destPath, 'utf8')
      expect(content).toBeDefined()
      cleanupBrain(result)
    })

    it('should overwrite existing template', () => {
      const result = createBrainWithTemplates('test-brain')

      const destPath = addTemplate({
        brainPath: result.brainPath,
        type: 'markdown',
        name: 'existing'
      })

      writeFileSync(destPath, '# Old Content', 'utf8')

      addTemplate({
        brainPath: result.brainPath,
        type: 'markdown',
        name: 'existing'
      })

      const content = readFileSync(destPath, 'utf8')
      expect(content).not.toBe('# Old Content')
      cleanupBrain(result)
    })
  })

  describe('run command', () => {
    it('should create markdown template via interactive prompt', async () => {
      const result = createBrainWithTemplates('test-brain')
      const { select, input } = await import('@inquirer/prompts')

      vi.mocked(select).mockResolvedValue('markdown')
      vi.mocked(input).mockResolvedValue('interactive-template')

      await run(['test-brain'], { brainId: 'test-brain' })

      const templatePath = join(
        result.brainPath,
        'raw',
        'templates',
        'markdown',
        '_custom',
        'interactive-template-template.md'
      )
      expect(existsSync(templatePath)).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Created'))
      cleanupBrain(result)
    })

    it('should create web clipper template via interactive prompt', async () => {
      const result = createBrainWithTemplates('test-brain')
      const { select, input } = await import('@inquirer/prompts')

      vi.mocked(select).mockResolvedValue('web-clipper')
      vi.mocked(input).mockResolvedValue('web-template')

      await run(['test-brain'], { brainId: 'test-brain' })

      const templatePath = join(
        result.brainPath,
        'raw',
        'templates',
        'web-clipper',
        '_custom',
        'web-template-template.json'
      )
      expect(existsSync(templatePath)).toBe(true)
      cleanupBrain(result)
    })

    it('should use default template name', async () => {
      const result = createBrainWithTemplates('test-brain')
      const { select, input } = await import('@inquirer/prompts')

      vi.mocked(select).mockResolvedValue('markdown')
      vi.mocked(input).mockImplementation(({ default: defaultValue }) => {
        return Promise.resolve(defaultValue || 'my-template')
      })

      await run(['test-brain'], { brainId: 'test-brain' })

      const templatePath = join(
        result.brainPath,
        'raw',
        'templates',
        'markdown',
        '_custom',
        'my-template-template.md'
      )
      expect(existsSync(templatePath)).toBe(true)
      cleanupBrain(result)
    })

    it('should exit with error when brain is not configured', async () => {
      const result = createBrainWithConfig('empty')
      writeFileSync(
        join(result.tmpHome, '.ai-brain-tool', 'config.json'),
        JSON.stringify({ brains: {} }),
        'utf8'
      )

      const { select } = await import('@inquirer/prompts')
      vi.mocked(select).mockResolvedValue('markdown')

      await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow()
      cleanupBrain(result)
    })
  })
})
