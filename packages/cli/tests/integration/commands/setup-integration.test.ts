import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  checkbox: vi.fn(),
  confirm: vi.fn()
}))

vi.mock('ora', () => {
  const createSpinner = () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis()
  })
  return {
    default: vi.fn(() => createSpinner())
  }
})

vi.mock('@ai-brain/core/graphify', () => ({
  createVenv: vi.fn().mockResolvedValue(undefined),
  venvPythonPath: vi.fn((path: string) => join(path, '.venv', 'bin', 'python3'))
}))

vi.mock('@ai-brain/core/index', () => ({
  detectAll: vi.fn().mockResolvedValue([]),
  configureSelected: vi.fn().mockResolvedValue(undefined)
}))

describe('setup integration', () => {
  let tmpHome: string
  let originalHome: string | undefined
  let tmpCwd: string
  let originalCwd: string

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-setup-test-'))
    tmpCwd = mkdtempSync(join(tmpdir(), 'ai-brain-setup-cwd-'))
    originalHome = process.env.HOME
    originalCwd = process.cwd()
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome
    process.chdir(tmpCwd)

    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )
  })

  afterEach(() => {
    process.env.HOME = originalHome
    delete process.env.__HOME__
    process.chdir(originalCwd)
    rmSync(tmpHome, { recursive: true, force: true })
    rmSync(tmpCwd, { recursive: true, force: true })
    vi.clearAllMocks()
  })

  it('should create new brain with git repository', async () => {
    const { input, select, checkbox, confirm } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('folder name')) return 'test-brain'
      if (message.includes('Path:')) return tmpCwd
      if (message.includes('Git remote')) return ''
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'current'
      if (message.includes('How do you want')) return 'git'
      if (message.includes('Do you use Obsidian')) return 'skip'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(confirm).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return false
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return []
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const brainPath = join(tmpCwd, 'test-brain')
    expect(existsSync(brainPath)).toBe(true)
    expect(existsSync(join(brainPath, '.brain-config.json'))).toBe(true)
    expect(existsSync(join(brainPath, 'raw'))).toBe(true)
  })

  it('should create new brain without git', async () => {
    const { input, select, checkbox, confirm } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('folder name')) return 'no-git-brain'
      if (message.includes('Path:')) return tmpCwd
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'current'
      if (message.includes('How do you want')) return 'local'
      if (message.includes('Do you use Obsidian')) return 'skip'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(confirm).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return false
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return []
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const brainPath = join(tmpCwd, 'no-git-brain')
    expect(existsSync(brainPath)).toBe(true)
    expect(existsSync(join(brainPath, '.git'))).toBe(false)
  })

  it('should handle existing brain setup (new machine)', async () => {
    mkdirSync(join(tmpCwd, 'raw'), { recursive: true })
    writeFileSync(join(tmpCwd, '.graphifyignore'), '', 'utf8')
    writeFileSync(
      join(tmpCwd, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }),
      'utf8'
    )

    const { input, select, checkbox } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Brain identifier')) return 'existing'
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Do you use Obsidian')) return 'skip'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const configContent = JSON.parse(
      readFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'utf8')
    ) as { brains: Record<string, string> }
    const normalizedStoredPath = configContent.brains.existing.replace('/private', '')
    const normalizedTmpCwd = tmpCwd.replace('/private', '')
    expect(normalizedStoredPath).toBe(normalizedTmpCwd)
  })

  it('should handle duplicate brain identifier', async () => {
    const { input, select, checkbox } = await import('@inquirer/prompts')

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { 'test-brain': join(tmpHome, 'test-brain') } }),
      'utf8'
    )

    let callCount = 0
    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Brain identifier')) {
        callCount++
        if (callCount === 1) return 'test-brain'
        return 'unique-brain'
      }
      if (message.includes('folder name')) return 'test-brain'
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'current'
      if (message.includes('How do you want')) return 'local'
      if (message.includes('Do you use Obsidian')) return 'skip'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return []
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const configContent = JSON.parse(
      readFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'utf8')
    ) as { brains: Record<string, string> }
    expect(configContent.brains['unique-brain']).toBeDefined()
  })

  it('should create brain with custom location', async () => {
    const { input, select, checkbox, confirm } = await import('@inquirer/prompts')
    const customLocation = mkdtempSync(join(tmpdir(), 'ai-brain-custom-'))

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('folder name')) return 'custom-brain'
      if (message.includes('Path:')) return customLocation
      if (message.includes('Git remote')) return ''
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'custom'
      if (message.includes('How do you want')) return 'git'
      if (message.includes('Do you use Obsidian')) return 'skip'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(confirm).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return false
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return []
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const brainPath = join(customLocation, 'custom-brain')
    expect(existsSync(brainPath)).toBe(true)

    rmSync(customLocation, { recursive: true, force: true })
  })

  it('should create brain with git remote and sync enabled', async () => {
    const { input, select, checkbox, confirm } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('folder name')) return 'remote-brain'
      if (message.includes('Path:')) return tmpCwd
      if (message.includes('Git remote')) return 'https://github.com/test/repo.git'
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'current'
      if (message.includes('How do you want')) return 'git'
      if (message.includes('Do you use Obsidian')) return 'skip'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(confirm).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return true
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return []
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const brainPath = join(tmpCwd, 'remote-brain')
    expect(existsSync(brainPath)).toBe(true)
    expect(existsSync(join(brainPath, '.git'))).toBe(true)
  })

  it('should create brain with extras selected', async () => {
    const { input, select, checkbox, confirm } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('folder name')) return 'extras-brain'
      if (message.includes('Path:')) return tmpCwd
      if (message.includes('Git remote')) return ''
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'current'
      if (message.includes('How do you want')) return 'git'
      if (message.includes('Do you use Obsidian')) return 'skip'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(confirm).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return false
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return ['office', 'video']
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const brainPath = join(tmpCwd, 'extras-brain')
    const configContent = JSON.parse(
      readFileSync(join(brainPath, '.brain-config.json'), 'utf8')
    ) as { extras: string[] }
    expect(configContent.extras).toEqual(['office', 'video'])
  })

  it('should setup obsidian with brain as vault', async () => {
    const { input, select, checkbox, confirm } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('folder name')) return 'obsidian-brain'
      if (message.includes('Path:')) return tmpCwd
      if (message.includes('Git remote')) return ''
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'current'
      if (message.includes('How do you want')) return 'git'
      if (message.includes('Do you use Obsidian')) return 'brain'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(confirm).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return false
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return []
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const brainPath = join(tmpCwd, 'obsidian-brain')
    const configContent = JSON.parse(
      readFileSync(join(brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    const normalizedObsidianDir = configContent.obsidianDir.replace('/private', '')
    const normalizedBrainPath = brainPath.replace('/private', '')
    expect(normalizedObsidianDir).toBe(normalizedBrainPath)
    expect(existsSync(join(brainPath, '.obsidian'))).toBe(true)
  })

  it('should setup obsidian with separate vault', async () => {
    const { input, select, checkbox, confirm } = await import('@inquirer/prompts')
    const separateVault = join(tmpCwd, 'separate-vault')
    mkdirSync(separateVault, { recursive: true })

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('folder name')) return 'sep-vault-brain'
      if (message.includes('Path:')) return tmpCwd
      if (message.includes('Git remote')) return ''
      if (message.includes('vault')) return separateVault
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ message, choices }) => {
      if (message.includes('Where do you want')) return 'current'
      if (message.includes('How do you want')) return 'git'
      if (message.includes('Do you use Obsidian')) return 'separate'
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(confirm).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return false
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('file types')) return []
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const brainPath = join(tmpCwd, 'sep-vault-brain')
    const configContent = JSON.parse(
      readFileSync(join(brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(separateVault)
  })
})
