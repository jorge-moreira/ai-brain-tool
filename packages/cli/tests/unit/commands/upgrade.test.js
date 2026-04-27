import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    green: vi.fn((s) => s),
    yellow: vi.fn((s) => s)
  }
}))

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn()
  }))
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    cpSync: vi.fn(actual.cpSync),
    readFileSync: vi.fn(actual.readFileSync)
  }
})

vi.mock('../../../src/config.js', () => ({
  resolveBrain: vi.fn(),
  getBrainPath: vi.fn()
}))

vi.mock('../../../src/graphify.js', () => ({
  upgradeVenv: vi.fn()
}))

describe('commands/upgrade', () => {
  let consoleLogSpy, consoleErrorSpy, processExitSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should exit with error when brain cannot be resolved', async () => {
    const config = await import('../../../src/config.js')
    config.getBrainPath.mockImplementation(() => {
      throw new Error('No brain configured')
    })

    const { run } = await import('../../../src/commands/upgrade.js')
    
    await run([]).catch(() => {})

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('No brain configured')
    )
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })

  it('should upgrade graphify without extras when no brain config', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'upgrade-test-'))
    const fs = await import('fs')
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found')
    })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const graphify = await import('../../../src/graphify.js')
    graphify.upgradeVenv.mockResolvedValue()

    const { run } = await import('../../../src/commands/upgrade.js')
    await run([])

    expect(graphify.upgradeVenv).toHaveBeenCalledWith(tmp, [])
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Upgrade complete')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should upgrade graphify with extras from brain config', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'upgrade-test-'))
    const fs = await import('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify({ extras: ['office', 'video'] }))

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const graphify = await import('../../../src/graphify.js')
    graphify.upgradeVenv.mockResolvedValue()

    const { run } = await import('../../../src/commands/upgrade.js')
    await run([])

    expect(graphify.upgradeVenv).toHaveBeenCalledWith(tmp, ['office', 'video'])

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should copy bundled templates', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'upgrade-test-'))
    const fs = await import('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify({ extras: [] }))

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const graphify = await import('../../../src/graphify.js')
    graphify.upgradeVenv.mockResolvedValue()

    const { run } = await import('../../../src/commands/upgrade.js')
    await run([])

    expect(fs.cpSync).toHaveBeenCalledWith(
      expect.stringContaining('_bundled'),
      expect.stringContaining('_bundled'),
      expect.objectContaining({ recursive: true, force: true })
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id from args', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'upgrade-test-'))
    const fs = await import('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify({ extras: [] }))

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const graphify = await import('../../../src/graphify.js')
    graphify.upgradeVenv.mockResolvedValue()

    const { run } = await import('../../../src/commands/upgrade.js')
    await run(['my-brain'])

    expect(config.getBrainPath).toHaveBeenCalledWith(['my-brain'], {})

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should accept brain-id from options', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'upgrade-test-'))
    const fs = await import('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify({ extras: [] }))

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const graphify = await import('../../../src/graphify.js')
    graphify.upgradeVenv.mockResolvedValue()

    const { run } = await import('../../../src/commands/upgrade.js')
    await run([], { brainId: 'option-brain' })

    expect(config.getBrainPath).toHaveBeenCalledWith([], { brainId: 'option-brain' })

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should handle empty extras array', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'upgrade-test-'))
    const fs = await import('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify({}))

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const graphify = await import('../../../src/graphify.js')
    graphify.upgradeVenv.mockResolvedValue()

    const { run } = await import('../../../src/commands/upgrade.js')
    await run([])

    expect(graphify.upgradeVenv).toHaveBeenCalledWith(tmp, [])

    rmSync(tmp, { recursive: true, force: true })
  })
})
