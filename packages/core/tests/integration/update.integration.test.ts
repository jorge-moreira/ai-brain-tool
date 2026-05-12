import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { updateBrain, updateBrainById } from '@ai-brain/core/update'
import { GraphifyError, GitSyncError } from '@ai-brain/core/errors'
import { createBrainWithConfig, cleanupBrain } from '../helpers'
import { mkdtempSync, rmSync, PathLike } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { addBrain } from '@ai-brain/core/config'

vi.mock('@ai-brain/core/graphify', () => ({
  runGraphify: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('@ai-brain/core/git', () => ({
  syncBrain: vi.fn().mockResolvedValue({ status: 'skipped' })
}))

import { runGraphify } from '@ai-brain/core/graphify'
import { syncBrain } from '@ai-brain/core/git'

describe('updateBrain integration', () => {
  let brain: ReturnType<typeof createBrainWithConfig>

  beforeEach(() => {
    vi.resetAllMocks()
    ;(runGraphify as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'skipped' })
    brain = createBrainWithConfig('test-brain', { gitSync: false })
  })

  afterEach(() => {
    cleanupBrain(brain)
  })

  it('should return UpdateResult with gitSync skipped', async () => {
    const result = await updateBrain(brain.brainPath)
    expect(result.gitSync).toBe('skipped')
    expect(result.gitSyncError).toBeUndefined()
  })

  it('should return UpdateResult with gitSync ok', async () => {
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'ok' })
    const result = await updateBrain(brain.brainPath)
    expect(result.gitSync).toBe('ok')
  })

  it('should return UpdateResult with gitSync failed and gitSyncError', async () => {
    const gitError = new GitSyncError('no-remote', 'no remote configured')
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'failed',
      error: gitError
    })
    const result = await updateBrain(brain.brainPath)
    expect(result.gitSync).toBe('failed')
    expect(result.gitSyncError).toBeInstanceOf(GitSyncError)
    expect((result.gitSyncError as GitSyncError).code).toBe('no-remote')
  })

  it('should not call syncBrain when runGraphify throws GraphifyError', async () => {
    ;(runGraphify as ReturnType<typeof vi.fn>).mockRejectedValue(
      new GraphifyError('process-failed', 'graphify boom')
    )
    await expect(updateBrain(brain.brainPath)).rejects.toBeInstanceOf(GraphifyError)
    expect(syncBrain).not.toHaveBeenCalled()
  })
})

describe('updateBrainById integration', () => {
  let tmpHome: PathLike
  let originalHome: string | undefined
  let brain: ReturnType<typeof createBrainWithConfig>

  beforeEach(() => {
    vi.resetAllMocks()
    ;(runGraphify as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'skipped' })

    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-updatebyid-test-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome as string

    brain = createBrainWithConfig('updatebyid-brain', { gitSync: false })
    addBrain('updatebyid-brain', brain.brainPath)
  })

  afterEach(() => {
    process.env.HOME = originalHome
    rmSync(tmpHome, { recursive: true, force: true })
    cleanupBrain(brain)
  })

  it('should resolve brainId and return UpdateResult with gitSync skipped', async () => {
    const result = await updateBrainById('updatebyid-brain')
    expect(result.gitSync).toBe('skipped')
    expect(result.gitSyncError).toBeUndefined()
  })

  it('should resolve brainId and return UpdateResult with gitSync ok', async () => {
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'ok' })
    const result = await updateBrainById('updatebyid-brain')
    expect(result.gitSync).toBe('ok')
  })
})
