import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { run, listTemplates } from '../../../src/commands/templates/list'

describe('templates/list integration', () => {
  let tmpHome: string
  let originalHome: string | undefined
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-tmpl-list-test-'))
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
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true })
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

  describe('listTemplates function', () => {
    it('should list empty templates', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      const result = listTemplates(brainPath)

      expect(result.markdown.bundled).toEqual([])
      expect(result.markdown.custom).toEqual([])
      expect(result.webClipper.bundled).toEqual([])
      expect(result.webClipper.custom).toEqual([])
    })

    it('should list bundled markdown templates', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      writeFileSync(
        join(brainPath, 'raw', 'templates', 'markdown', '_bundled', 'note-template.md'),
        '# Note',
        'utf8'
      )
      writeFileSync(
        join(brainPath, 'raw', 'templates', 'markdown', '_bundled', 'meeting-template.md'),
        '# Meeting',
        'utf8'
      )

      const result = listTemplates(brainPath)

      expect(result.markdown.bundled).toContain('note-template.md')
      expect(result.markdown.bundled).toContain('meeting-template.md')
    })

    it('should list custom markdown templates', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      writeFileSync(
        join(brainPath, 'raw', 'templates', 'markdown', '_custom', 'my-template.md'),
        '# My Template',
        'utf8'
      )

      const result = listTemplates(brainPath)

      expect(result.markdown.custom).toContain('my-template.md')
    })

    it('should list bundled web clipper templates', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      writeFileSync(
        join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled', 'article-template.json'),
        '{}',
        'utf8'
      )

      const result = listTemplates(brainPath)

      expect(result.webClipper.bundled).toContain('article-template.json')
    })

    it('should list custom web clipper templates', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      writeFileSync(
        join(brainPath, 'raw', 'templates', 'web-clipper', '_custom', 'custom-clip.json'),
        '{}',
        'utf8'
      )

      const result = listTemplates(brainPath)

      expect(result.webClipper.custom).toContain('custom-clip.json')
    })

    it('should handle missing directories gracefully', () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      rmSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom'), {
        recursive: true,
        force: true
      })
      rmSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), {
        recursive: true,
        force: true
      })
      rmSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom'), {
        recursive: true,
        force: true
      })

      const result = listTemplates(brainPath)

      expect(result.markdown.bundled).toEqual([])
      expect(result.markdown.custom).toEqual([])
      expect(result.webClipper.bundled).toEqual([])
      expect(result.webClipper.custom).toEqual([])
    })
  })

  describe('run command', () => {
    it('should list all templates', async () => {
      const { brainPath } = createBrainWithConfig('test-brain')

      writeFileSync(
        join(brainPath, 'raw', 'templates', 'markdown', '_bundled', 'note-template.md'),
        '# Note',
        'utf8'
      )
      writeFileSync(
        join(brainPath, 'raw', 'templates', 'markdown', '_custom', 'my-template.md'),
        '# My Template',
        'utf8'
      )
      writeFileSync(
        join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled', 'article-template.json'),
        '{}',
        'utf8'
      )

      await run(['test-brain'], { brainId: 'test-brain' })

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Markdown templates'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Web Clipper templates'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('note-template.md'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('my-template.md'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('article-template.json'))
    })

    it('should show message when no custom templates', async () => {
      createBrainWithConfig('empty-brain')

      await run(['empty-brain'], { brainId: 'empty-brain' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('(none yet — run "ai-brain templates add" to create one)')
      )
    })

    it('should show help text', async () => {
      createBrainWithConfig('test-brain')

      await run(['test-brain'], { brainId: 'test-brain' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run "ai-brain templates add" to create a new custom template')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run "ai-brain upgrade" to update bundled templates')
      )
    })

    it('should exit with error when brain is not configured', async () => {
      writeFileSync(
        join(tmpHome, '.ai-brain-tool', 'config.json'),
        JSON.stringify({ brains: {} }),
        'utf8'
      )

      await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow()
    })
  })
})
