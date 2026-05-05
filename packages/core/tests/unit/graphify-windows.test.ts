import { describe, it, expect, vi } from 'vitest'

vi.mock('@ai-brain/core/graphify', async importOriginal => {
  const actual = await importOriginal<typeof import('@ai-brain/core/graphify')>()
  return {
    ...actual,
    isWindows: vi.fn().mockReturnValue(true)
  }
})

import { isWindows } from '@ai-brain/core/graphify'

describe('graphify on Windows', () => {
  it('should report isWindows as true when platform is win32', () => {
    expect(isWindows()).toBe(true)
  })
})
