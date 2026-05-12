import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateBrain } from '@ai-brain/core/update'
import { GraphifyError, GitSyncError, BrainNotFoundError } from '@ai-brain/core/errors'

vi.mock('@ai-brain/core/graphify', () => ({
  runGraphify: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('@ai-brain/core/git', () => ({
  syncBrain: vi.fn().mockResolvedValue({ status: 'skipped' })
}))

vi.mock('@ai-brain/core/config/brains', () => ({
  resolveBrain: vi.fn().mockReturnValue({ id: 'work', path: '/tmp/brain', isLocal: true })
}))

import { runGraphify } from '@ai-brain/core/graphify'
import { syncBrain } from '@ai-brain/core/git'
import { resolveBrain } from '@ai-brain/core/config/brains'
import { updateBrainById } from '@ai-brain/core/update'

describe('updateBrain', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(runGraphify as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'skipped' })
  })

  it('should return gitSync skipped when syncBrain returns skipped', async () => {
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'skipped' })
    const result = await updateBrain('/tmp/brain')
    expect(result.gitSync).toBe('skipped')
    expect(result.gitSyncError).toBeUndefined()
  })

  it('should return gitSync ok when syncBrain returns ok', async () => {
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'ok' })
    const result = await updateBrain('/tmp/brain')
    expect(result.gitSync).toBe('ok')
    expect(result.gitSyncError).toBeUndefined()
  })

  it('should return gitSync failed and gitSyncError when syncBrain returns failed', async () => {
    const gitError = new GitSyncError('no-remote', 'no remote')
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'failed',
      error: gitError
    })
    const result = await updateBrain('/tmp/brain')
    expect(result.gitSync).toBe('failed')
    expect(result.gitSyncError).toBe(gitError)
  })

  it('should call runGraphify before syncBrain', async () => {
    const order: string[] = []
    ;(runGraphify as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      order.push('graphify')
      return { success: true }
    })
    ;(syncBrain as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      order.push('sync')
      return { status: 'skipped' }
    })
    await updateBrain('/tmp/brain')
    expect(order).toEqual(['graphify', 'sync'])
  })

  it('should throw GraphifyError when runGraphify throws GraphifyError', async () => {
    const err = new GraphifyError('process-failed', 'graphify boom')
    ;(runGraphify as ReturnType<typeof vi.fn>).mockRejectedValue(err)
    await expect(updateBrain('/tmp/brain')).rejects.toBeInstanceOf(GraphifyError)
  })

  it('should throw unknown errors from runGraphify', async () => {
    ;(runGraphify as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('unexpected'))
    await expect(updateBrain('/tmp/brain')).rejects.toThrow('unexpected')
  })

  it('should not call syncBrain when runGraphify throws', async () => {
    ;(runGraphify as ReturnType<typeof vi.fn>).mockRejectedValue(
      new GraphifyError('unknown', 'fail')
    )
    await expect(updateBrain('/tmp/brain')).rejects.toThrow()
    expect(syncBrain).not.toHaveBeenCalled()
  })
})

describe('updateBrainById', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(resolveBrain as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'work',
      path: '/tmp/brain',
      isLocal: true
    })
    ;(runGraphify as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
    ;(syncBrain as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'ok' })
  })

  it('should resolve the brain and call updateBrain with the resolved path', async () => {
    const result = await updateBrainById('work')
    expect(resolveBrain).toHaveBeenCalledWith('work')
    expect(runGraphify).toHaveBeenCalledWith('/tmp/brain')
    expect(result.gitSync).toBe('ok')
  })

  it('should throw BrainNotFoundError when resolveBrain throws', async () => {
    ;(resolveBrain as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new BrainNotFoundError('nonexistent')
    })
    await expect(updateBrainById('nonexistent')).rejects.toBeInstanceOf(BrainNotFoundError)
  })
})
