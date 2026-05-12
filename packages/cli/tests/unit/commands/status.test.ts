import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { execa } from 'execa'
import { run } from '../../../src/commands/status'
import { getBrainPath } from '@ai-brain/core/config'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
    yellow: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s),
    bold: { cyan: vi.fn((s: string) => s) }
  }
}))

vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}))

vi.mock('@ai-brain/core/config', () => ({
  getBrainPath: vi.fn<typeof getBrainPath>()
}))

vi.mock('@ai-brain/core/graphify', () => ({
  venvPythonPath: vi.fn((brainPath: string) => join(brainPath, '.venv', 'bin', 'python3'))
}))

const mockedGetBrainPath = getBrainPath as Mock<typeof getBrainPath>
const mockedExeca = execa as unknown as Mock<() => Promise<{ stdout: string; stderr: string }>>

describe('commands/status', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.clearAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('No brain configured')
    })

    await expect(run([], {})).rejects.toThrow()
  })

  it('should show tool version', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedExeca.mockRejectedValue(new Error('no graphify'))

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tool version'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show not installed message when .venv is missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], {})

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

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedExeca.mockImplementation(() => Promise.resolve({ stdout: '1.0.0', stderr: '' }))

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Graphify:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1.0.0'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show error reading graphify version', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    const pythonPath = join(tmp, '.venv', 'bin', 'python3')
    mkdirSync(dirname(pythonPath), { recursive: true })
    writeFileSync(pythonPath, '#!/usr/bin/env python3', 'utf8')

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedExeca.mockRejectedValue(new Error('failed'))

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('error reading version'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graph not built message when graph.json missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedExeca.mockRejectedValue(new Error('no graphify'))

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not built yet'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show error when graph.json is invalid JSON', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, '.venv', 'bin'), { recursive: true })
    mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
    writeFileSync(join(tmp, 'graphify-out/graph.json'), 'invalid json {{{', 'utf8')

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedExeca.mockRejectedValue(new Error('no graphify'))

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('could not read graph.json'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graph stats when graph.json exists', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
    writeFileSync(
      join(tmp, 'graphify-out/graph.json'),
      JSON.stringify({
        nodes: [{ id: '1' }],
        edges: [{ id: 'e1' }]
      }),
      'utf8'
    )

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedExeca.mockRejectedValue(new Error('no graphify'))

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1 nodes'))

    rmSync(tmp, { recursive: true, force: true })
  })

  it('should show graph stats with unknown count when nodes/edges missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'status-test-'))
    mkdirSync(join(tmp, 'graphify-out'), { recursive: true })
    writeFileSync(
      join(tmp, 'graphify-out/graph.json'),
      JSON.stringify({
        nodes: null,
        edges: null
      }),
      'utf8'
    )

    mockedGetBrainPath.mockReturnValue(tmp)
    mockedExeca.mockRejectedValue(new Error('no graphify'))

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('? nodes'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('? edges'))

    rmSync(tmp, { recursive: true, force: true })
  })
})
