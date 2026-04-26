import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s) => s),
    green: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
    dim: vi.fn((s) => s),
    bold: { cyan: vi.fn((s) => s) }
  }
}))

vi.mock('execa')

vi.mock("../../../src/config.js", () => ({
  getBrainPath: vi.fn(),
  readConfig: vi.fn()
}))

vi.mock('../../../src/graphify.js', () => ({
  venvPythonPath: vi.fn((brainPath) => join(brainPath, '.venv', 'bin', 'python3'))
}))

describe('commands/status', () => {
  let consoleLogSpy
  let execa

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const execaModule = await import('execa')
    execa = execaModule.execa
    vi.clearAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    const config = await import('../../../src/config.js')
    config.getBrainPath.mockImplementation(() => { throw new Error("No brain configured") })

    const { run } = await import('../../../src/commands/status.js')
    
    await expect(run()).rejects.toThrow()
  })

  it('should show tool version', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tool version')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show not installed message when .venv is missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    const { run } = await import('../../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('not installed (.venv missing)')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graphify version when available', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    const pythonPath = join(tmp, '.venv', 'bin', 'python3')
    mkdirSync(dirname(pythonPath), { recursive: true })
    writeFileSync(pythonPath, '#!/usr/bin/env python3', 'utf8')

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    execa.mockResolvedValue({ stdout: '1.0.0', stderr: '' })

    const { run } = await import('../../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Graphify:')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('1.0.0')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show error reading graphify version', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    const pythonPath = join(tmp, '.venv', 'bin', 'python3')
    mkdirSync(dirname(pythonPath), { recursive: true })
    writeFileSync(pythonPath, '#!/usr/bin/env python3', 'utf8')

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    execa.mockRejectedValue(new Error('failed'))

    const { run } = await import('../../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('error reading version')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graph not built message when graph.json missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../../src/commands/status.js')
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

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../../src/commands/status.js')
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

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('1 nodes')
    )

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graph stats with unknown count when nodes/edges missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
    writeFileSync(join(tmp, 'graphify-out/graph.json'), JSON.stringify({
      nodes: null,
      edges: null
    }), 'utf8')

    const config = await import('../../../src/config.js')
    config.getBrainPath.mockReturnValue(tmp)

    execa.mockRejectedValue(new Error('no graphify'))

    const { run } = await import('../../../src/commands/status.js')
    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('? nodes')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('? edges')
    )

    rmSync(tmp, { recursive: true, force: true })
  })
})
