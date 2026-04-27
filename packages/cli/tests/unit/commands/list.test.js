import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((s) => s),
    cyan: vi.fn((s) => s),
    bold: vi.fn((s) => s),
    dim: vi.fn((s) => s)
  }
}))

vi.mock('../../../src/config.js', () => ({
  listBrains: vi.fn()
}))

describe('commands/list', () => {
  let consoleLogSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should list all configured brains', async () => {
    const config = await import('../../../src/config.js')
    config.listBrains.mockReturnValue([
      { id: 'work', path: '/tmp/work' },
      { id: 'personal', path: '/tmp/personal' }
    ])

    const { run } = await import('../../../src/commands/list.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('work')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('personal')
    )
  })

  it('should show message when no brains configured', async () => {
    const config = await import('../../../src/config.js')
    config.listBrains.mockReturnValue([])

    const { run } = await import('../../../src/commands/list.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No brains configured')
    )
  })

  it('should display brain identifier and path', async () => {
    const config = await import('../../../src/config.js')
    config.listBrains.mockReturnValue([
      { id: 'work', path: '/tmp/work' }
    ])

    const { run } = await import('../../../src/commands/list.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('work')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('/tmp/work')
    )
  })
})