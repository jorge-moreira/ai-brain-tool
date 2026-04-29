import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { run } from '../../../src/commands/list'

describe('list command integration', () => {
  let tmpHome: string
  let originalHome: string | undefined

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-list-test-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome

    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )
  })

  afterEach(() => {
    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show empty list when no brains configured', async () => {
    const consoleSpy = vi.spyOn(console, 'log')

    await run()

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No brains configured'))
    consoleSpy.mockRestore()
  })

  it('should list configured brains', async () => {
    const brain1Path = join(tmpHome, 'brain1')
    const brain2Path = join(tmpHome, 'brain2')
    mkdirSync(brain1Path, { recursive: true })
    mkdirSync(brain2Path, { recursive: true })

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({
        brains: {
          work: brain1Path,
          personal: brain2Path
        }
      }),
      'utf8'
    )

    const consoleSpy = vi.spyOn(console, 'log')

    await run()

    const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n')
    expect(output).toContain('work')
    expect(output).toContain('personal')
    expect(output).toContain(brain1Path)
    expect(output).toContain(brain2Path)

    consoleSpy.mockRestore()
  })

  it('should show brain with local indicator when in brain folder', async () => {
    const brainPath = join(tmpHome, 'mybrain')
    mkdirSync(brainPath, { recursive: true })
    writeFileSync(join(brainPath, '.brain-config.json'), JSON.stringify({ id: 'mybrain' }), 'utf8')

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({
        brains: {
          mybrain: brainPath
        }
      }),
      'utf8'
    )

    const consoleSpy = vi.spyOn(console, 'log')

    await run()

    const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n')
    expect(output).toContain('mybrain')

    consoleSpy.mockRestore()
  })
})
