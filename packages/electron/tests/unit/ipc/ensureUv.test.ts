import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureUv } from '@ai-brain/core/graphify'

vi.mock('execa')
vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn(),
    fail: vi.fn()
  })
}))

describe('ensureUv IPC Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exists and is a function', () => {
    expect(ensureUv).toBeDefined()
    expect(typeof ensureUv).toBe('function')
  })

  it('returns a promise', () => {
    const result = ensureUv()
    expect(result).toBeInstanceOf(Promise)
  })

  it('can complete successfully', async () => {
    vi.mocked(await import('execa')).execa.mockResolvedValue({ stdout: 'uv 0.5.0', stderr: '' } as any)
    
    await expect(ensureUv()).resolves.toBeUndefined()
  })

  it('can throw on error', async () => {
    vi.mocked(await import('execa')).execa.mockRejectedValue(new Error('Test error'))
    
    await expect(ensureUv()).rejects.toThrow()
  })
})
