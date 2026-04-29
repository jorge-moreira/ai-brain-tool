import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execa } from 'execa'
import { run } from '../../../src/commands/update'
import ora from 'ora'

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
    const graphPath = join(brainPath, 'graphify-out', 'graph.json')
    if (!existsSync(graphPath)) {
      mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })
      writeFileSync(graphPath, JSON.stringify({ nodes: [], edges: [] }), 'utf8')
    }
  }),
  venvPythonPath: vi.fn((path: string) => join(path, '.venv', 'bin', 'python3'))
}))

describe('commands/update integration', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createBrainWithConfig(brainName: string, config = {}) {
    const tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-update-test-'))
    const originalHome = process.env.HOME
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome

    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })

    const brainPath = join(tmpHome, brainName)
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
    mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })

    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null, ...config }),
      'utf8'
    )

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { [brainName]: brainPath } }),
      'utf8'
    )

    return { brainPath, tmpHome, originalHome }
  }

  async function initGitRepo(brainPath: string, withRemote = false, remoteRepo?: string) {
    await execa('git', ['init'], { cwd: brainPath })
    await execa('git', ['config', 'user.email', 'test@test.com'], { cwd: brainPath })
    await execa('git', ['config', 'user.name', 'Test'], { cwd: brainPath })

    if (withRemote && remoteRepo) {
      await execa('git', ['init', '--bare', remoteRepo])
      await execa('git', ['remote', 'add', 'origin', remoteRepo], { cwd: brainPath })
    }
  }

  it('should rebuild knowledge graph', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('test-brain')

    writeFileSync(
      join(brainPath, 'raw', 'notes', 'test.md'),
      '# Test Note\n\nThis is a test.',
      'utf8'
    )

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should update brain with git sync disabled', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('no-git-brain')

    writeFileSync(join(brainPath, 'raw', 'notes', 'note.md'), '# Note', 'utf8')

    await run(['no-git-brain'], { brainId: 'no-git-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should skip git sync gracefully when no remote', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('git-no-remote-brain', {
      gitSync: true
    })

    await initGitRepo(brainPath, false)

    writeFileSync(join(brainPath, 'README.md'), '# Test', 'utf8')
    await execa('git', ['add', '.'], { cwd: brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: brainPath })

    await run(['git-no-remote-brain'], { brainId: 'git-no-remote-brain' })

    const oraMock = ora as unknown as Mock<() => SpinnerMock>
    const warnMessage = getOraWarnCall(oraMock)
    expect(warnMessage).toContain('Git sync skipped')

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show warning when gitSync enabled but no git repo', async () => {
    const { tmpHome, originalHome } = createBrainWithConfig('no-git-repo-brain', {
      gitSync: true
    })

    await run(['no-git-repo-brain'], { brainId: 'no-git-repo-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Git sync enabled but no git repository found')
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should include changed files in commit message', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('changes-brain', {
      gitSync: true
    })

    await initGitRepo(brainPath, false)

    writeFileSync(join(brainPath, 'README.md'), '# Initial', 'utf8')
    writeFileSync(join(brainPath, 'raw', 'notes', 'existing.md'), '# Existing', 'utf8')
    await execa('git', ['add', '.'], { cwd: brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: brainPath })

    writeFileSync(join(brainPath, 'raw', 'notes', 'new-note.md'), '# New Note', 'utf8')
    await execa('git', ['add', '.'], { cwd: brainPath })

    await run(['changes-brain'], { brainId: 'changes-brain' })

    const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: brainPath })
    expect(log).toContain('brain: update')
    expect(log).toContain('new-note.md')

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should push to local bare repo when remote exists', async () => {
    const remoteRepo = join(tmpdir(), `remote-repo-${Date.now()}.git`)
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('push-brain', {
      gitSync: true
    })

    await initGitRepo(brainPath, true, remoteRepo)

    writeFileSync(join(brainPath, 'README.md'), '# Initial', 'utf8')
    writeFileSync(join(brainPath, 'raw', 'notes', 'existing.md'), '# Existing', 'utf8')
    await execa('git', ['add', '.'], { cwd: brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: brainPath })
    await execa('git', ['push', '-u', 'origin', 'main'], { cwd: brainPath })

    writeFileSync(join(brainPath, 'raw', 'notes', 'update.md'), '# Update', 'utf8')
    await execa('git', ['add', '.'], { cwd: brainPath })

    await run(['push-brain'], { brainId: 'push-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brain updated'))

    const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: remoteRepo })
    expect(log).toContain('brain: update')

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
    rmSync(remoteRepo, { recursive: true, force: true })
  })

  it('should handle empty git diff with generic commit message', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('empty-diff-brain', {
      gitSync: true
    })

    await initGitRepo(brainPath, false)

    writeFileSync(join(brainPath, 'README.md'), '# Initial', 'utf8')
    await execa('git', ['add', '.'], { cwd: brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: brainPath })

    await run(['empty-diff-brain'], { brainId: 'empty-diff-brain' })

    const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: brainPath })
    expect(log).toContain('Update AI brain')

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should handle git commit with no changes gracefully', async () => {
    const { brainPath, tmpHome, originalHome } = createBrainWithConfig('no-changes-brain', {
      gitSync: true
    })

    await initGitRepo(brainPath, false)

    writeFileSync(join(brainPath, 'README.md'), '# Initial', 'utf8')
    await execa('git', ['add', '.'], { cwd: brainPath })
    await execa('git', ['commit', '-m', 'initial'], { cwd: brainPath })

    await run(['no-changes-brain'], { brainId: 'no-changes-brain' })

    const oraMock = ora as unknown as Mock<() => SpinnerMock>
    const warnMessage = getOraWarnCall(oraMock)
    expect(warnMessage).toContain('Git sync skipped')

    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })
})
