import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execa } from 'execa'
import { run } from '../../../src/commands/update'
import ora from 'ora'
import { createBrainWithConfig, cleanupBrain } from '../../helpers'

interface SpinnerMock {
  start: Mock<() => SpinnerMock>
  succeed: Mock<(text?: string) => SpinnerMock>
  warn: Mock<(text?: string) => SpinnerMock>
}

function getOraWarnCall(oraMock: Mock<() => SpinnerMock>): string | undefined {
  for (const r of oraMock.mock.results) {
    const spinner = r.value as SpinnerMock | undefined
    const warnMock = spinner?.warn as Mock | undefined
    const calls = warnMock?.mock?.calls
    if (calls && calls.length > 0) {
      return calls[0][0] as string
    }
  }
  return undefined
}

vi.mock('ora', () => {
  const createSpinner = () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis()
  })
  return {
    default: vi.fn(() => createSpinner())
  }
})

vi.mock('@ai-brain/core/graphify', () => ({
  runGraphify: vi.fn().mockImplementation(async (brainPath: string) => {
    mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })
    writeFileSync(
      join(brainPath, 'graphify-out', 'graph.json'),
      JSON.stringify({ nodes: [], edges: [] }),
      'utf8'
    )
  }),
  venvPythonPath: vi.fn((path: string) => join(path, '.venv', 'bin', 'python3'))
}))

async function initGitRepo(brainPath: string, withRemote = false, remoteRepo?: string) {
  await execa('git', ['init', '--initial-branch=main'], { cwd: brainPath })
  await execa('git', ['config', 'user.email', 'test@test.com'], { cwd: brainPath })
  await execa('git', ['config', 'user.name', 'Test'], { cwd: brainPath })

  if (withRemote && remoteRepo) {
    await execa('git', ['init', '--bare', '--initial-branch=main', remoteRepo])
    await execa('git', ['remote', 'add', 'origin', remoteRepo], { cwd: brainPath })
  }
}

describe('commands/update integration', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should rebuild knowledge graph', async () => {
    const result = createBrainWithConfig('test-brain', {}, ['raw/notes', 'graphify-out'])

    writeFileSync(
      join(result.brainPath, 'raw', 'notes', 'test.md'),
      '# Test Note\n\nThis is a test.',
      'utf8'
    )

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))
    cleanupBrain(result)
  })

  it('should update brain with git sync disabled', async () => {
    const result = createBrainWithConfig('no-git-brain', {}, ['raw/notes', 'graphify-out'])

    writeFileSync(join(result.brainPath, 'raw', 'notes', 'note.md'), '# Note', 'utf8')

    await run(['no-git-brain'], { brainId: 'no-git-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))
    cleanupBrain(result)
  })

  it('should skip git sync gracefully when no remote', async () => {
    const result = createBrainWithConfig('git-no-remote-brain', { gitSync: true }, [
      'raw/notes',
      'graphify-out'
    ])

    await initGitRepo(result.brainPath, false)

    writeFileSync(join(result.brainPath, 'README.md'), '# Test', 'utf8')
    await execa('git', ['add', '.'], { cwd: result.brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: result.brainPath })

    await run(['git-no-remote-brain'], { brainId: 'git-no-remote-brain' })

    const oraMock = ora as unknown as Mock<() => SpinnerMock>
    const warnMessage = getOraWarnCall(oraMock)
    expect(warnMessage).toContain('Git sync skipped')

    cleanupBrain(result)
  })

  it('should show warning when gitSync enabled but no git repo', async () => {
    const result = createBrainWithConfig('no-git-repo-brain', { gitSync: true }, [
      'raw/notes',
      'graphify-out'
    ])

    await run(['no-git-repo-brain'], { brainId: 'no-git-repo-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Git sync enabled but no git repository found')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))

    cleanupBrain(result)
  })

  it('should include changed files in commit message', async () => {
    const result = createBrainWithConfig('changes-brain', { gitSync: true }, [
      'raw/notes',
      'graphify-out'
    ])

    await initGitRepo(result.brainPath, false)

    writeFileSync(join(result.brainPath, 'README.md'), '# Initial', 'utf8')
    writeFileSync(join(result.brainPath, 'raw', 'notes', 'existing.md'), '# Existing', 'utf8')
    await execa('git', ['add', '.'], { cwd: result.brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: result.brainPath })

    writeFileSync(join(result.brainPath, 'raw', 'notes', 'new-note.md'), '# New Note', 'utf8')
    await execa('git', ['add', '.'], { cwd: result.brainPath })

    await run(['changes-brain'], { brainId: 'changes-brain' })

    const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: result.brainPath })
    expect(log).toContain('brain: update')
    expect(log).toContain('new-note.md')

    cleanupBrain(result)
  })

  it('should push to local bare repo when remote exists', async () => {
    const remoteRepo = join(tmpdir(), `remote-repo-${Date.now()}.git`)
    const result = createBrainWithConfig('push-brain', { gitSync: true }, [
      'raw/notes',
      'graphify-out'
    ])

    await initGitRepo(result.brainPath, true, remoteRepo)

    writeFileSync(join(result.brainPath, 'README.md'), '# Initial', 'utf8')
    writeFileSync(join(result.brainPath, 'raw', 'notes', 'existing.md'), '# Existing', 'utf8')
    await execa('git', ['add', '.'], { cwd: result.brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: result.brainPath })
    await execa('git', ['push', '-u', 'origin', 'main'], { cwd: result.brainPath })

    writeFileSync(join(result.brainPath, 'raw', 'notes', 'update.md'), '# Update', 'utf8')
    await execa('git', ['add', '.'], { cwd: result.brainPath })

    await run(['push-brain'], { brainId: 'push-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))

    const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: remoteRepo })
    expect(log).toContain('brain: update')

    cleanupBrain(result)
    rmSync(remoteRepo, { recursive: true, force: true })
  })

  it('should handle empty git diff with generic commit message', async () => {
    const result = createBrainWithConfig('empty-diff-brain', { gitSync: true }, [
      'raw/notes',
      'graphify-out'
    ])

    await initGitRepo(result.brainPath, false)

    writeFileSync(join(result.brainPath, 'README.md'), '# Initial', 'utf8')
    await execa('git', ['add', '.'], { cwd: result.brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: result.brainPath })

    await run(['empty-diff-brain'], { brainId: 'empty-diff-brain' })

    const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: result.brainPath })
    expect(log).toContain('Update AI brain')

    cleanupBrain(result)
  })

  it('should handle git commit with no changes gracefully', async () => {
    const result = createBrainWithConfig('no-changes-brain', { gitSync: true }, [
      'raw/notes',
      'graphify-out'
    ])

    await initGitRepo(result.brainPath, false)

    writeFileSync(join(result.brainPath, 'README.md'), '# Initial', 'utf8')
    await execa('git', ['add', '.'], { cwd: result.brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: result.brainPath })

    await run(['no-changes-brain'], { brainId: 'no-changes-brain' })

    const oraMock = ora as unknown as Mock<() => SpinnerMock>
    const warnMessage = getOraWarnCall(oraMock)
    expect(warnMessage).toContain('Git sync skipped')

    cleanupBrain(result)
  })
})
