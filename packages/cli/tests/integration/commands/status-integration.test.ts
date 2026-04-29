import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execa, type Result } from 'execa'
import { run } from '../../../src/commands/status'

describe('commands/status integration', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createBrainWithConfig(brainName: string) {
    const tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-status-test-'))
    const originalHome = process.env.HOME
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome

    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })

    const brainPath = join(tmpHome, brainName)
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })

    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }),
      'utf8'
    )

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { [brainName]: brainPath } }),
      'utf8'
    )

    return { brainPath, tmpHome, originalHome }
  }

  it('should show tool version and brain path', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('test-brain')

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tool version:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain path:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(brainPath))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show git status when git repo exists', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('git-brain')

    await execa('git', ['init'], { cwd: brainPath })
    await execa('git', ['config', 'user.email', 'test@test.com'], { cwd: brainPath })
    await execa('git', ['config', 'user.name', 'Test'], { cwd: brainPath })

    await run(['git-brain'], { brainId: 'git-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tool version:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain path:'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show graph statistics when graph exists', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('graph-brain')

    writeFileSync(
      join(brainPath, 'graphify-out', 'graph.json'),
      JSON.stringify({
        nodes: [{ id: '1', label: 'Test' }],
        edges: [{ source: '1', target: '2' }]
      }),
      'utf8'
    )

    await run(['graph-brain'], { brainId: 'graph-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Graph:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('nodes'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('edges'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show message when graph not built', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('no-graph-brain')

    rmSync(join(brainPath, 'graphify-out'), { recursive: true, force: true })

    await run(['no-graph-brain'], { brainId: 'no-graph-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not built yet'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-brain update'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show graphify version when .venv exists', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('venv-brain')

    const venvBin = join(brainPath, '.venv', 'bin')
    mkdirSync(venvBin, { recursive: true })
    writeFileSync(join(venvBin, 'python3'), '#!/usr/bin/env python3', 'utf8')

    vi.spyOn(await import('execa'), 'execa').mockResolvedValueOnce({
      stdout: 'graphify v1.2.3',
      stderr: ''
    } as Result)

    await run(['venv-brain'], { brainId: 'venv-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Graphify:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('graphify v1.2.3'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show error message when graphify version check fails', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('venv-error-brain')

    const venvBin = join(brainPath, '.venv', 'bin')
    mkdirSync(venvBin, { recursive: true })
    writeFileSync(join(venvBin, 'python3'), '#!/usr/bin/env python3', 'utf8')

    vi.spyOn(await import('execa'), 'execa').mockRejectedValueOnce(new Error('Command failed'))

    await run(['venv-error-brain'], { brainId: 'venv-error-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('error reading version'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show error message when graph.json is invalid', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('invalid-graph-brain')

    writeFileSync(join(brainPath, 'graphify-out', 'graph.json'), 'not valid json', 'utf8')

    await run(['invalid-graph-brain'], { brainId: 'invalid-graph-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('could not read graph.json'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })
})
