import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { run } from '../../../src/commands/upgrade'
import { createBrainWithConfig, cleanupBrain } from '../../helpers'

vi.mock('ora', () => {
  const createSpinner = () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis()
  })
  return {
    default: vi.fn(() => createSpinner())
  }
})

vi.mock('@ai-brain/core/graphify', () => ({
  upgradeVenv: vi.fn().mockResolvedValue(undefined),
  venvPythonPath: vi.fn((path: string) => join(path, '.venv', 'bin', 'python3'))
}))

describe('upgrade integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should upgrade brain without extras', async () => {
    const result = createBrainWithConfig('test-brain', {}, [
      'raw/templates/markdown/_bundled',
      'raw/templates/markdown/_custom',
      'raw/templates/web-clipper/_bundled',
      'raw/templates/web-clipper/_custom'
    ])

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
    cleanupBrain(result)
  })

  it('should upgrade brain with extras', async () => {
    const result = createBrainWithConfig(
      'extras-brain',
      {
        extras: ['office', 'video']
      },
      [
        'raw/templates/markdown/_bundled',
        'raw/templates/markdown/_custom',
        'raw/templates/web-clipper/_bundled',
        'raw/templates/web-clipper/_custom'
      ]
    )

    await run(['extras-brain'], { brainId: 'extras-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
    cleanupBrain(result)
  })

  it('should refresh bundled templates', async () => {
    const result = createBrainWithConfig('template-brain', {}, [
      'raw/templates/markdown/_bundled',
      'raw/templates/markdown/_custom',
      'raw/templates/web-clipper/_bundled',
      'raw/templates/web-clipper/_custom'
    ])

    const customTemplatePath = join(
      result.brainPath,
      'raw',
      'templates',
      'markdown',
      '_custom',
      'my-template.md'
    )
    writeFileSync(customTemplatePath, '# Custom Template', 'utf8')

    await run(['template-brain'], { brainId: 'template-brain' })

    expect(existsSync(customTemplatePath)).toBe(true)
    const customContent = readFileSync(customTemplatePath, 'utf8')
    expect(customContent).toBe('# Custom Template')
    cleanupBrain(result)
  })

  it('should handle brain without config file gracefully', async () => {
    const result = createBrainWithConfig('no-config-brain', {}, [
      'raw/templates/markdown/_bundled',
      'raw/templates/web-clipper/_bundled'
    ])

    await run(['no-config-brain'], { brainId: 'no-config-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
    cleanupBrain(result)
  })

  it('should exit with error when brain is not configured', async () => {
    const result = createBrainWithConfig('empty-brain', {}, [])
    // replace config with empty brains
    const configPath = join(result.tmpHome, '.ai-brain-tool', 'config.json')
    writeFileSync(configPath, JSON.stringify({ brains: {} }), 'utf8')

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('PROCESS_EXIT')
    })

    await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow(
      'PROCESS_EXIT'
    )

    exitSpy.mockRestore()
    cleanupBrain(result)
  })

  it('should use arguments when no brainId option provided', async () => {
    const result = createBrainWithConfig('default-brain', {}, [
      'raw/templates/markdown/_bundled',
      'raw/templates/markdown/_custom',
      'raw/templates/web-clipper/_bundled',
      'raw/templates/web-clipper/_custom'
    ])

    await run(['default-brain'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
    cleanupBrain(result)
  })
})
