import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest'
import { run } from '../../../src/commands/list'
import { listBrains } from '@ai-brain/core/config'

vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((s: string) => s),
    cyan: vi.fn((s: string) => s),
    bold: vi.fn((s: string) => s),
    dim: vi.fn((s: string) => s)
  }
}))

vi.mock('@ai-brain/core/config', () => ({
  listBrains: vi.fn()
}))

const mockedListBrains = listBrains as Mock<typeof listBrains>

describe('commands/list', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should list all configured brains', async () => {
    mockedListBrains.mockReturnValue([
      { id: 'work', path: '/tmp/work' },
      { id: 'personal', path: '/tmp/personal' }
    ])

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('work'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('personal'))
  })

  it('should show message when no brains configured', async () => {
    mockedListBrains.mockReturnValue([])

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No brains configured'))
  })

  it('should display brain identifier and path', async () => {
    mockedListBrains.mockReturnValue([{ id: 'work', path: '/tmp/work' }])

    await run()

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('work'))
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/tmp/work'))
  })
})
