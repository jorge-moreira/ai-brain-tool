export type GitSyncErrorCode = 'no-remote' | 'nothing-to-commit' | 'push-failed' | 'unknown'
export type GraphifyErrorCode = 'no-venv' | 'no-files' | 'process-failed' | 'unknown'

export class BrainNotFoundError extends Error {
  readonly brainId: string
  constructor(brainId: string) {
    super(`Brain "${brainId}" not found`)
    this.name = 'BrainNotFoundError'
    this.brainId = brainId
  }
}

export class GraphifyError extends Error {
  readonly code: GraphifyErrorCode
  constructor(code: GraphifyErrorCode, message: string, cause?: Error) {
    super(message)
    this.name = 'GraphifyError'
    this.code = code
    if (cause !== undefined) this.cause = cause
  }
}

export class GitSyncError extends Error {
  readonly code: GitSyncErrorCode
  constructor(code: GitSyncErrorCode, message: string, cause?: Error) {
    super(message)
    this.name = 'GitSyncError'
    this.code = code
    if (cause !== undefined) this.cause = cause
  }
}
