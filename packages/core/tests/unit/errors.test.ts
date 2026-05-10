import { describe, it, expect } from 'vitest'
import { GraphifyError, GitSyncError, BrainNotFoundError, NotABrainError } from '@ai-brain/core/errors'

describe('NotABrainError', () => {
  it('should have name NotABrainError', () => {
    const e = new NotABrainError('/some/path', ['raw', '.graphifyignore'])
    expect(e.name).toBe('NotABrainError')
  })

  it('should include path in message', () => {
    const e = new NotABrainError('/some/path', ['raw', '.graphifyignore'])
    expect(e.message).toContain('/some/path')
  })

  it('should include all markers in message', () => {
    const markers = ['raw', '.graphifyignore', '.brain-config.json']
    const e = new NotABrainError('/some/path', markers)
    for (const marker of markers) {
      expect(e.message).toContain(marker)
    }
  })

  it('should be instanceof Error', () => {
    expect(new NotABrainError('/some/path', [])).toBeInstanceOf(Error)
  })
})

describe('BrainNotFoundError', () => {
  it('should have name BrainNotFoundError', () => {
    const e = new BrainNotFoundError('my-brain')
    expect(e.name).toBe('BrainNotFoundError')
  })

  it('should expose brainId', () => {
    const e = new BrainNotFoundError('my-brain')
    expect(e.brainId).toBe('my-brain')
  })

  it('should have descriptive message', () => {
    const e = new BrainNotFoundError('my-brain')
    expect(e.message).toBe('Brain "my-brain" not found')
  })

  it('should be instanceof Error', () => {
    expect(new BrainNotFoundError('my-brain')).toBeInstanceOf(Error)
  })
})

describe('GraphifyError', () => {
  it('should have name GraphifyError', () => {
    const e = new GraphifyError('no-venv', 'venv missing')
    expect(e.name).toBe('GraphifyError')
  })

  it('should expose code', () => {
    const e = new GraphifyError('process-failed', 'msg')
    expect(e.code).toBe('process-failed')
  })

  it('should expose message', () => {
    const e = new GraphifyError('unknown', 'something went wrong')
    expect(e.message).toBe('something went wrong')
  })

  it('should expose cause when provided', () => {
    const cause = new Error('root cause')
    const e = new GraphifyError('unknown', 'msg', cause)
    expect(e.cause).toBe(cause)
  })

  it('should be instanceof Error', () => {
    expect(new GraphifyError('unknown', 'msg')).toBeInstanceOf(Error)
  })
})

describe('GitSyncError', () => {
  it('should have name GitSyncError', () => {
    const e = new GitSyncError('no-remote', 'no remote')
    expect(e.name).toBe('GitSyncError')
  })

  it('should expose code', () => {
    const e = new GitSyncError('nothing-to-commit', 'nothing')
    expect(e.code).toBe('nothing-to-commit')
  })

  it('should expose message', () => {
    const e = new GitSyncError('push-failed', 'push failed')
    expect(e.message).toBe('push failed')
  })

  it('should expose cause when provided', () => {
    const cause = new Error('root')
    const e = new GitSyncError('unknown', 'msg', cause)
    expect(e.cause).toBe(cause)
  })

  it('should be instanceof Error', () => {
    expect(new GitSyncError('unknown', 'msg')).toBeInstanceOf(Error)
  })
})
