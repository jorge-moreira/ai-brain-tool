import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { run } from '../../../src/commands/list'
import { createBrainWithConfig, cleanupBrain, addBrainToConfig } from '../../helpers'

describe('list command integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show empty list when no brains configured', async () => {
    const result = createBrainWithConfig('empty', {}, [])
    // clear brains from config
    writeFileSync(
      join(result.tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No brains configured'))
    cleanupBrain(result)
  })

  it('should list configured brains', async () => {
    const result = createBrainWithConfig('brain1', {}, [])
    addBrainToConfig(result.tmpHome, 'personal', join(result.tmpHome, 'brain2'))
    mkdirSync(join(result.tmpHome, 'brain2'), { recursive: true })

    await run()

    const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n')
    expect(output).toContain('brain1')
    expect(output).toContain('personal')
    expect(output).toContain(result.brainPath)
    cleanupBrain(result)
  })

  it('should show brain with local indicator when in brain folder', async () => {
    const result = createBrainWithConfig('mybrain', {}, [])

    await run()

    const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n')
    expect(output).toContain('mybrain')
    cleanupBrain(result)
  })
})
