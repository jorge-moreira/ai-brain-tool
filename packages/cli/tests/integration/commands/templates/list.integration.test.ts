import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { run, listTemplates } from '../../../../src/commands/templates/list'
import { createBrainWithConfig, cleanupBrain } from '../../../helpers'

describe('templates/list integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createBrainWithTemplates(name: string) {
    return createBrainWithConfig(name, {}, [
      'raw/templates/markdown/_bundled',
      'raw/templates/markdown/_custom',
      'raw/templates/web-clipper/_bundled',
      'raw/templates/web-clipper/_custom'
    ])
  }

  describe('listTemplates function', () => {
    it('should list empty templates', () => {
      const result = createBrainWithTemplates('test-brain')

      const templates = listTemplates(result.brainPath)

      expect(templates.markdown.bundled).toEqual([])
      expect(templates.markdown.custom).toEqual([])
      expect(templates.webClipper.bundled).toEqual([])
      expect(templates.webClipper.custom).toEqual([])
      cleanupBrain(result)
    })

    it('should list bundled markdown templates', () => {
      const result = createBrainWithTemplates('test-brain')

      writeFileSync(
        join(result.brainPath, 'raw', 'templates', 'markdown', '_bundled', 'note-template.md'),
        '# Note',
        'utf8'
      )
      writeFileSync(
        join(result.brainPath, 'raw', 'templates', 'markdown', '_bundled', 'meeting-template.md'),
        '# Meeting',
        'utf8'
      )

      const templates = listTemplates(result.brainPath)

      expect(templates.markdown.bundled).toContain('note-template.md')
      expect(templates.markdown.bundled).toContain('meeting-template.md')
      cleanupBrain(result)
    })

    it('should list custom markdown templates', () => {
      const result = createBrainWithTemplates('test-brain')

      writeFileSync(
        join(result.brainPath, 'raw', 'templates', 'markdown', '_custom', 'my-template.md'),
        '# My Template',
        'utf8'
      )

      const templates = listTemplates(result.brainPath)

      expect(templates.markdown.custom).toContain('my-template.md')
      cleanupBrain(result)
    })

    it('should list bundled web clipper templates', () => {
      const result = createBrainWithTemplates('test-brain')

      writeFileSync(
        join(
          result.brainPath,
          'raw',
          'templates',
          'web-clipper',
          '_bundled',
          'article-template.json'
        ),
        '{}',
        'utf8'
      )

      const templates = listTemplates(result.brainPath)

      expect(templates.webClipper.bundled).toContain('article-template.json')
      cleanupBrain(result)
    })

    it('should list custom web clipper templates', () => {
      const result = createBrainWithTemplates('test-brain')

      writeFileSync(
        join(result.brainPath, 'raw', 'templates', 'web-clipper', '_custom', 'custom-clip.json'),
        '{}',
        'utf8'
      )

      const templates = listTemplates(result.brainPath)

      expect(templates.webClipper.custom).toContain('custom-clip.json')
      cleanupBrain(result)
    })

    it('should handle missing directories gracefully', () => {
      const result = createBrainWithTemplates('test-brain')

      rmSync(join(result.brainPath, 'raw', 'templates', 'markdown', '_custom'), {
        recursive: true,
        force: true
      })
      rmSync(join(result.brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), {
        recursive: true,
        force: true
      })
      rmSync(join(result.brainPath, 'raw', 'templates', 'web-clipper', '_custom'), {
        recursive: true,
        force: true
      })

      const templates = listTemplates(result.brainPath)

      expect(templates.markdown.bundled).toEqual([])
      expect(templates.markdown.custom).toEqual([])
      expect(templates.webClipper.bundled).toEqual([])
      expect(templates.webClipper.custom).toEqual([])
      cleanupBrain(result)
    })
  })

  describe('run command', () => {
    it('should list all templates', async () => {
      const result = createBrainWithTemplates('test-brain')

      writeFileSync(
        join(result.brainPath, 'raw', 'templates', 'markdown', '_bundled', 'note-template.md'),
        '# Note',
        'utf8'
      )
      writeFileSync(
        join(result.brainPath, 'raw', 'templates', 'markdown', '_custom', 'my-template.md'),
        '# My Template',
        'utf8'
      )
      writeFileSync(
        join(
          result.brainPath,
          'raw',
          'templates',
          'web-clipper',
          '_bundled',
          'article-template.json'
        ),
        '{}',
        'utf8'
      )

      await run(['test-brain'], { brainId: 'test-brain' })

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Markdown templates'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Web Clipper templates'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('note-template.md'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('my-template.md'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('article-template.json'))
      cleanupBrain(result)
    })

    it('should show message when no custom templates', async () => {
      const result = createBrainWithTemplates('empty-brain')

      await run(['empty-brain'], { brainId: 'empty-brain' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('(none yet — run "ai-brain templates add" to create one)')
      )
      cleanupBrain(result)
    })

    it('should show help text', async () => {
      const result = createBrainWithTemplates('test-brain')

      await run(['test-brain'], { brainId: 'test-brain' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run "ai-brain templates add" to create a new custom template')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run "ai-brain upgrade" to update bundled templates')
      )
      cleanupBrain(result)
    })

    it('should exit with error when brain is not configured', async () => {
      const result = createBrainWithConfig('empty', {}, [])
      writeFileSync(
        join(result.tmpHome, '.ai-brain-tool', 'config.json'),
        JSON.stringify({ brains: {} }),
        'utf8'
      )

      await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow()
      cleanupBrain(result)
    })
  })
})
