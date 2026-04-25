import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
    green: vi.fn((s) => s)
  }
}))

vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis()
  })
}))

vi.mock('../../src/graphify.js', () => ({
  runGraphify: vi.fn().mockResolvedValue(undefined)
}))

describe('commands/update', () => {
  let resolveBrainSpy, readBrainConfigSpy, consoleLogSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const config = await import('../../src/config.js')
    resolveBrainSpy = vi.spyOn(config, 'resolveBrain')
    readBrainConfigSpy = vi.spyOn(config, 'readBrainConfig')
  })

  afterEach(() => vi.resetAllMocks())

  it('should resolve brain from id argument', async () => {
    resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(resolveBrainSpy).toHaveBeenCalledWith('work')
  })

  it('should resolve brain from options.brainId', async () => {
    resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run([], { brainId: 'work' })

    expect(resolveBrainSpy).toHaveBeenCalledWith('work')
  })

  it('should print brain id in success message', async () => {
    resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('work'))
  })

  it('should throw when brain not found', async () => {
    resolveBrainSpy.mockImplementation(() => {
      throw new Error('Brain "nonexistent" not found')
    })

    const { run } = await import('../../src/commands/update.js')
    await expect(run(['nonexistent'], {})).rejects.toThrow('BRAIN_NOT_RESOLVED')
  })

  it('should throw when no brain configured', async () => {
    resolveBrainSpy.mockReturnValue({ id: null, path: null, isLocal: false })

    const { run } = await import('../../src/commands/update.js')
    await expect(run(['work'], {})).rejects.toThrow('NO_BRAIN_CONFIGURED')
  })

  it('should skip git sync when gitSync is false', async () => {
    resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
    readBrainConfigSpy.mockReturnValue({ gitSync: false })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))
  })

  it('should warn when gitSync enabled but no git repo', async () => {
    resolveBrainSpy.mockReturnValue({ id: 'work', path: '/tmp/work', isLocal: false })
    readBrainConfigSpy.mockReturnValue({ gitSync: true })

    const { run } = await import('../../src/commands/update.js')
    await run(['work'], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('git repository found')
    )
  })
})