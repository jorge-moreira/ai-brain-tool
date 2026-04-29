import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { run } from '../../../src/commands/upgrade'

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
  let tmpHome: string
  let originalHome: string | undefined
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-upgrade-test-'))
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

  function createBrainWithConfig(brainName: string, config = {}) {
    const brainPath = join(tmpHome, brainName)
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom'), { recursive: true })

    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null, ...config }),
      'utf8'
    )

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { [brainName]: brainPath } }),
      'utf8'
    )

    return { brainPath }
  }

  it('should upgrade brain without extras', async () => {
    createBrainWithConfig('test-brain')

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
  })

  it('should upgrade brain with extras', async () => {
    createBrainWithConfig('extras-brain', {
      extras: ['office', 'video']
    })

    await run(['extras-brain'], { brainId: 'extras-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
  })

  it('should refresh bundled templates', async () => {
    const { brainPath } = createBrainWithConfig('template-brain')

    const customTemplatePath = join(
      brainPath,
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
  })

  it('should handle brain without config file gracefully', async () => {
    const brainPath = join(tmpHome, 'no-config-brain')
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true })

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { 'no-config-brain': brainPath } }),
      'utf8'
    )

    await run(['no-config-brain'], { brainId: 'no-config-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
  })

  it('should exit with error when brain is not configured', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('PROCESS_EXIT')
    })

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )

    await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow(
      'PROCESS_EXIT'
    )

    exitSpy.mockRestore()
  })

  it('should use arguments when no brainId option provided', async () => {
    createBrainWithConfig('default-brain')

    await run(['default-brain'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade complete'))
  })
})
