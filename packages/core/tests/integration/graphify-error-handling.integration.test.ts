import { describe, it, expect, beforeEach, afterEach, Mock } from 'vitest'
import { vi } from 'vitest'
import { execa } from 'execa'
import { ensureUv } from '@ai-brain/core/graphify'

vi.mock('execa')
const mockedExeca = execa as unknown as Mock<() => Promise<{ stdout: string; stderr: string }>>

describe('ensureUv error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should throw network error message on ENOTFOUND', async () => {
    // Mock uv --version to fail (uv not installed)
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('Command failed')
    })

    // Mock uv install to fail with network error
    mockedExeca.mockImplementationOnce(() => {
      const error = new Error('Network error')
      error.message = 'ENOTFOUND'
      throw error
    })

    await expect(ensureUv()).rejects.toThrow('Cannot download uv')
  })

  it('should throw network error message on ECONNRESET', async () => {
    // Mock uv --version to fail (uv not installed)
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('Command failed')
    })

    // Mock uv install to fail with connection reset
    mockedExeca.mockImplementationOnce(() => {
      const error = new Error('Connection reset')
      error.message = 'ECONNRESET'
      throw error
    })

    await expect(ensureUv()).rejects.toThrow('Cannot download uv')
  })

  it('should throw permission error on EACCES', async () => {
    // Mock uv --version to fail (uv not installed)
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('Command failed')
    })

    // Mock uv install to fail with permission denied
    mockedExeca.mockImplementationOnce(() => {
      const error = new Error('Permission denied')
      error.message = 'EACCES'
      throw error
    })

    await expect(ensureUv()).rejects.toThrow('Permission denied')
  })

  it('should throw permission error on "permission denied" message', async () => {
    // Mock uv --version to fail (uv not installed)
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('Command failed')
    })

    // Mock uv install to fail with permission denied in message
    mockedExeca.mockImplementationOnce(() => {
      const error = new Error('permission denied: cannot write to /usr/local')
      throw error
    })

    await expect(ensureUv()).rejects.toThrow('Permission denied')
  })

  it('should throw generic error for other failures', async () => {
    // Mock uv --version to fail (uv not installed)
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('Command failed')
    })

    // Mock uv install to fail with generic error
    mockedExeca.mockImplementationOnce(() => {
      const error = new Error('Some random error')
      throw error
    })

    await expect(ensureUv()).rejects.toThrow('Failed to install uv')
  })

  it('should throw error when uv installed but not in PATH', async () => {
    // Mock uv --version to fail (uv not installed)
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('Command failed')
    })

    // Mock uv install to succeed
    mockedExeca.mockImplementationOnce(() => Promise.resolve({ stdout: '', stderr: '' }))

    // Mock uv --version to fail again (not in PATH)
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('Command not found')
    })

    await expect(ensureUv()).rejects.toThrow('uv was installed but is not available in PATH')
  })
})
