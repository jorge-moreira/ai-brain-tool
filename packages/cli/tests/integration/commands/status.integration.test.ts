import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { run } from '../../../src/commands/status'
import { createBrainWithConfig, cleanupBrain } from '../../helpers'

describe('commands/status integration', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show tool version and brain path', async () => {
    const result = createBrainWithConfig('test-brain', {}, ['graphify-out'])

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tool version:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain path:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(result.brainPath))

    cleanupBrain(result)
  })

  it('should show git status when git repo exists', async () => {
    const result = createBrainWithConfig('git-brain', {}, ['graphify-out'])

    await execa('git', ['init'], { cwd: result.brainPath })
    await execa('git', ['config', 'user.email', 'test@test.com'], { cwd: result.brainPath })
    await execa('git', ['config', 'user.name', 'Test'], { cwd: result.brainPath })

    await run(['git-brain'], { brainId: 'git-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tool version:'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain path:'))

    cleanupBrain(result)
  })

  it('should show graph statistics when graph exists', async () => {
    const result = createBrainWithConfig('graph-brain', {}, ['graphify-out'])

    writeFileSync(
      join(result.brainPath, 'graphify-out', 'graph.json'),
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

    cleanupBrain(result)
  })

  it('should show message when graph not built', async () => {
    const result = createBrainWithConfig('no-graph-brain', {}, ['graphify-out'])

    rmSync(join(result.brainPath, 'graphify-out'), { recursive: true, force: true })

    await run(['no-graph-brain'], { brainId: 'no-graph-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not built yet'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-brain update'))

    cleanupBrain(result)
  })

  it('should show error message when graph.json is invalid', async () => {
    const result = createBrainWithConfig('invalid-graph-brain', {}, ['graphify-out'])

    writeFileSync(join(result.brainPath, 'graphify-out', 'graph.json'), 'not valid json', 'utf8')

    await run(['invalid-graph-brain'], { brainId: 'invalid-graph-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('could not read graph.json'))

    cleanupBrain(result)
  })
})
