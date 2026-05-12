import { runGraphify } from '@ai-brain/core/graphify'
import { syncBrain } from '@ai-brain/core/git'
import { resolveBrain } from '@ai-brain/core/config/brains'
import type { GitSyncError } from '@ai-brain/core/errors'

export interface UpdateResult {
  gitSync: 'skipped' | 'ok' | 'failed'
  gitSyncError?: GitSyncError
}

export async function updateBrain(brainPath: string): Promise<UpdateResult> {
  await runGraphify(brainPath)
  const { status, error } = await syncBrain(brainPath)
  return { gitSync: status, gitSyncError: error }
}

export async function updateBrainById(brainId: string): Promise<UpdateResult> {
  const { path } = resolveBrain(brainId)
  return updateBrain(path)
}
