import { describe, it, expect, vi } from 'vitest'
import { GitSyncError } from '@ai-brain/core/errors'
import { createBrainWithConfig, cleanupBrain } from '../helpers'
import { execSync } from 'child_process'

vi.mock('execa', () => ({
  execa: vi.fn().mockRejectedValue(new Error('permission denied: unknown error'))
}))

import { syncBrain } from '@ai-brain/core/git'

describe('git classifyGitError unknown', () => {
  it('should classify unknown git errors with code "unknown"', async () => {
    const brain = createBrainWithConfig('unknown-err-brain', { gitSync: true })

    // Create .git dir so syncBrain proceeds past the skip check
    execSync('git init', { cwd: brain.brainPath, stdio: 'ignore' })

    const result = await syncBrain(brain.brainPath)

    expect(result.status).toBe('failed')
    expect(result.error).toBeInstanceOf(GitSyncError)
    expect(result.error?.code).toBe('unknown')

    cleanupBrain(brain)
  })
})
