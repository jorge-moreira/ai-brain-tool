import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    green: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
    dim: vi.fn((s) => s),
    bold: { cyan: vi.fn((s) => s) }
  }
}))

vi.mock('execa', () => ({
  execa: vi.fn()
}))

vi.mock('../../src/config.js', () => ({
  readConfig: vi.fn()
}))

vi.mock('../../src/graphify.js', () => ({
  venvPythonPath: vi.fn((brainPath) => join(brainPath, '.venv', 'bin', 'python3'))
}))

describe('commands/status', () => {
  let consoleLogSpy

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue(null)

    const { run } = await import('../../src/commands/status.js')
    
    await expect(run()).rejects.toThrow()
  })

  it('should show tool version', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tool version')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graphify version when available', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { execa } = await import('execa')
    execa.mockResolvedValue({ stdout: '1.0.0', stderr: '' })

    const { run } = await import('../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Graphify:')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show error reading graphify version', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('failed'))

    const { run } = await import('../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Graphify:')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graph not built message when graph.json missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('not built yet')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show error when graph.json is invalid JSON', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
    writeFileSync(join(tmp, 'graphify-out/graph.json'), 'invalid json {{{', 'utf8')

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('could not read graph.json')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graph stats when graph.json exists', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
    writeFileSync(join(tmp, 'graphify-out/graph.json'), JSON.stringify({
      nodes: [{ id: '1' }],
      edges: [{ id: 'e1' }]
    }), 'utf8')

    const config = await import('../../src/config.js')
    config.readConfig.mockReturnValue({ brainPath: tmp })

    const { execa } = await import('execa')
    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('1 nodes')
    )

    rmSync(tmp, { recursive: true, force: true })
  })
})
