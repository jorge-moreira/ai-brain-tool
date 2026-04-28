import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import * as fs from 'fs'
import { select, input } from '@inquirer/prompts'
import { run, addTemplate } from '../../../../src/commands/templates/add'
import { getBrainPath } from '@ai-brain/core/config'

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s)
  }
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn<typeof select>(),
  input: vi.fn<typeof input>()
}))

vi.mock('@ai-brain/core/config', () => ({
  getBrainPath: vi.fn<typeof getBrainPath>()
}))

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  cpSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdtempSync: vi.fn(() => '/tmp/mock-tmp'),
  rmSync: vi.fn()
}))

const mockedSelect = select as Mock<typeof select>
const mockedInput = input as Mock<typeof input>
const mockedGetBrainPath = getBrainPath as Mock<typeof getBrainPath>
const mockedExistsSync = fs.existsSync as unknown as Mock<typeof fs.existsSync>
const mockedMkdtempSync = fs.mkdtempSync as unknown as Mock<typeof fs.mkdtempSync>
const mockedMkdirSync = fs.mkdirSync as unknown as Mock<typeof fs.mkdirSync>
const mockedWriteFileSync = fs.writeFileSync as unknown as Mock<typeof fs.writeFileSync>
const mockedReadFileSync = fs.readFileSync as unknown as Mock<typeof fs.readFileSync>

describe('commands/templates/add', () => {
  let consoleLogSpy: Mock<Console['log']>

  beforeEach(async () => {
    vi.clearAllMocks()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should exit with error when no brain configured', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('No brain configured')
    })

    await expect(run([], {})).rejects.toThrow()
  })

  it('should prompt for template type and name', async () => {
    mockedSelect.mockResolvedValue('markdown')
    mockedInput.mockResolvedValue('test-template')

    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedMkdirSync.mockImplementation(() => {})

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], {})

    expect(mockedSelect).toHaveBeenCalled()
    expect(mockedInput).toHaveBeenCalled()
  })

  it('should print success message with created path', async () => {
    mockedSelect.mockResolvedValue('markdown')
    mockedInput.mockResolvedValue('test-template')

    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedMkdirSync.mockImplementation(() => {})

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], {})

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Created'))
  })

  it('should accept brain-id as positional argument', async () => {
    mockedSelect.mockResolvedValue('markdown')
    mockedInput.mockResolvedValue('test-template')

    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedMkdirSync.mockImplementation(() => {})

    mockedGetBrainPath.mockReturnValue(tmp)

    await run(['my-brain'], {})

    expect(mockedGetBrainPath).toHaveBeenCalledWith(['my-brain'], {})
  })

  it('should accept brain-id via --brain-id option', async () => {
    mockedSelect.mockResolvedValue('markdown')
    mockedInput.mockResolvedValue('test-template')

    const tmp = '/tmp/test-brain'
    mockedMkdtempSync.mockReturnValue(tmp)
    mockedMkdirSync.mockImplementation(() => {})

    mockedGetBrainPath.mockReturnValue(tmp)

    await run([], { brainId: 'my-brain' })

    expect(mockedGetBrainPath).toHaveBeenCalledWith([], { brainId: 'my-brain' })
  })

  it('should exit with error when brain-id not found', async () => {
    mockedGetBrainPath.mockImplementation(() => {
      throw new Error('Brain not found')
    })

    await expect(run(['nonexistent'], {})).rejects.toThrow()
  })

  describe('addTemplate helper', () => {
    it('should create a markdown template file in _custom/', async () => {
      const tmp = '/tmp/test-brain'
      mockedMkdirSync.mockImplementation(() => {})
      mockedWriteFileSync.mockImplementation(() => {})
      mockedReadFileSync.mockReturnValue('# Markdown template starter')
      mockedExistsSync.mockReturnValue(true)

      addTemplate({ brainPath: tmp, type: 'markdown', name: 'research-interview' })

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('research-interview-template.md'),
        expect.any(String),
        'utf8'
      )
    })

    it('should create a web-clipper template .json file in _custom/', async () => {
      const tmp = '/tmp/test-brain'
      mockedMkdirSync.mockImplementation(() => {})
      mockedWriteFileSync.mockImplementation(() => {})
      mockedReadFileSync.mockReturnValue('{"json": "starter"}')
      mockedExistsSync.mockReturnValue(true)

      addTemplate({ brainPath: tmp, type: 'web-clipper', name: 'podcast' })

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('podcast-template.json'),
        expect.any(String),
        'utf8'
      )
    })
  })
})
