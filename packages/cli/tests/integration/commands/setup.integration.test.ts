import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { Mock } from 'vitest'

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
  createGlobalVenv: vi.fn().mockResolvedValue(undefined),
  venvPythonPath: vi.fn((path: string) => join(path, '.venv', 'bin', 'python3')),
  globalVenvPythonPath: vi.fn(() => '/fake/.venv/bin/python3'),
  globalVenvExists: vi.fn().mockReturnValue(true),
  ensureUv: vi.fn().mockResolvedValue(undefined),
  detectPython: vi.fn().mockResolvedValue('python3'),
  isWindows: vi.fn().mockReturnValue(false)
}))

vi.mock('@ai-brain/core/index', () => ({
  detectAll: vi.fn().mockResolvedValue([]),
  configureSelected: vi.fn().mockResolvedValue(undefined)
}))

let mockIsBrainIdAvailable: Mock
let mockWriteConfig: Mock
let mockAddBrain: Mock
let mockReadConfig: Mock
let mockGraphifyyExtras: string[]

const BRAIN_MARKERS = ['raw', '.graphifyignore', '.brain-config.json']

vi.mock('@ai-brain/core/config', async () => {
  const actual = await vi.importActual('@ai-brain/core/config')
  return {
    ...actual,
    readConfig: vi.fn(() => {
      const configPath = join(process.env.HOME || '/tmp', '.ai-brain-tool', 'config.json')
      if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf8'))
      }
      return { brains: {}, aiTools: [], graphifyyExtras: [], installationComplete: true }
    }),
    writeConfig: vi.fn(),
    addBrain: vi.fn(),
    ensureConfigDir: vi.fn(),
    configPath: vi.fn(() => '/fake/config/path'),
    isBrainIdAvailable: vi.fn((brainId: string) => {
      const configPath = join(process.env.HOME || '/tmp', '.ai-brain-tool', 'config.json')
      if (!existsSync(configPath)) return true
      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      return !config.brains || !config.brains[brainId]
    }),
    isInstallationComplete: vi.fn().mockReturnValue(true),
    setInstallationComplete: vi.fn(),
    addGraphifyyExtra: vi.fn(),
    createInitialConfig: vi.fn(() => ({
      installationComplete: false,
      graphifyyExtras: [],
      aiTools: [],
      brains: []
    })),
    isExistingBrain: vi.fn((dir: string) =>
      BRAIN_MARKERS.every((f: string) => existsSync(join(dir, f)))
    )
  }
})

vi.mock('@ai-brain/core/brains', async () => {
  const actual = await vi.importActual('@ai-brain/core/brains')
  return {
    ...actual,
    createBrain: vi.fn().mockImplementation(async options => {
      const brainPath = join(options.basePath, options.name)
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(brainPath, 'raw'), { recursive: true })

      // Handle obsidianDir: if includeObsidian is true and obsidianDir is null, use brainPath
      const finalObsidianDir =
        options.includeObsidian && options.obsidianDir === null
          ? brainPath
          : (options.obsidianDir ?? null)

      writeFileSync(join(brainPath, '.graphifyignore'), '', 'utf8')
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({
          gitSync: options.gitSync ?? false,
          obsidianDir: finalObsidianDir
        }),
        'utf8'
      )
      if (options.includeObsidian) {
        mkdirSync(join(brainPath, '.obsidian'), { recursive: true })
      }
      if (options.useGit) {
        mkdirSync(join(brainPath, '.git'), { recursive: true })
      }
      // Simulate addBrain call by updating config
      const configPath = join(process.env.HOME || '/tmp', '.ai-brain-tool', 'config.json')
      let config = { brains: {}, aiTools: [], graphifyyExtras: [], installationComplete: true }
      if (existsSync(configPath)) {
        config = JSON.parse(readFileSync(configPath, 'utf8'))
      }
      config.brains[options.name] = brainPath
      writeFileSync(configPath, JSON.stringify(config), 'utf8')
      return { success: true, brainId: options.name, brainPath }
    }),
    importBrain: vi.fn(),
    removeBrain: vi.fn(),
    isExistingBrain: vi.fn()
  }
})

vi.mock('@ai-brain/core/platforms', () => ({
  detectAll: vi.fn().mockResolvedValue([]),
  createBrainMCP: vi.fn()
}))

describe('setup integration', () => {
  let tmpHome: string
  let originalHome: string | undefined
  let tmpCwd: string
  let originalCwd: string

  beforeEach(async () => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-setup-test-'))
    tmpCwd = mkdtempSync(join(tmpdir(), 'ai-brain-setup-cwd-'))
    originalHome = process.env.HOME
    originalCwd = process.cwd()
    process.env.HOME = tmpHome
    process.chdir(tmpCwd)

    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })

    // Reset mocks and set up defaults
    vi.clearAllMocks()
    mockGraphifyyExtras = []

    const configModule = await import('@ai-brain/core/config')
    mockIsBrainIdAvailable = configModule.isBrainIdAvailable as Mock
    mockWriteConfig = configModule.writeConfig as Mock
    mockAddBrain = configModule.addBrain as Mock
    mockReadConfig = configModule.readConfig as Mock

    mockIsBrainIdAvailable.mockReturnValue(true)
    mockWriteConfig.mockImplementation((config: { graphifyyExtras?: string[] }) => {
      if (config?.graphifyyExtras) {
        mockGraphifyyExtras = config.graphifyyExtras
      }
      writeFileSync(
        join(tmpHome, '.ai-brain-tool', 'config.json'),
        JSON.stringify({ brains: {}, graphifyyExtras: mockGraphifyyExtras }),
        'utf8'
      )
    })
    mockAddBrain.mockImplementation((id: string, path: string) => {
      const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
      let config: { brains: Record<string, string> }
      try {
        config = JSON.parse(readFileSync(configPath, 'utf8')) as { brains: Record<string, string> }
      } catch {
        config = { brains: {} }
      }
      config.brains[id] = path
      writeFileSync(configPath, JSON.stringify(config), 'utf8')
    })
    mockReadConfig.mockImplementation(() => {
      const configPath = join(tmpHome, '.ai-brain-tool', 'config.json')
      if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf8')) as { brains: Record<string, string> }
      }
      return { brains: {} }
    })

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )
  })

  afterEach(() => {
    process.env.HOME = originalHome
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

  it('should handle brain creation with default name', async () => {
    const { input, select, checkbox } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Brain identifier')) return 'default-brain'
      if (message.includes('folder name')) return 'default-brain'
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
    expect(configContent.brains['default-brain']).toBeDefined()
  })

  it('should handle brain creation with default name', async () => {
    const { input, select, checkbox } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Brain identifier')) return 'unique-brain'
      if (message.includes('folder name')) return 'unique-brain'
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

    // Reset installation state to trigger installation flow
    const configModule = await import('@ai-brain/core/config')
    ;(configModule.isInstallationComplete as Mock).mockReturnValue(false)

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
      if (message.includes('video')) return true
      if (message.includes('office')) return true
      if (message.includes('Commit extraction')) return true
      if (message.includes('Auto-sync')) return false
      return defaultValue ?? false
    })

    vi.mocked(checkbox).mockImplementation(async ({ message }) => {
      if (message.includes('AI tools')) return []
      return []
    })

    const { run } = await import('../../../src/commands/setup')
    await run()

    const globalConfigContent = JSON.parse(
      readFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'utf8')
    ) as { graphifyyExtras: string[] }
    expect(globalConfigContent.graphifyyExtras).toEqual(['video', 'office'])
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

  it('should handle corrupted global config in new machine setup', async () => {
    mkdirSync(join(tmpCwd, 'raw'), { recursive: true })
    writeFileSync(join(tmpCwd, '.graphifyignore'), '', 'utf8')
    writeFileSync(
      join(tmpCwd, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }),
      'utf8'
    )

    // Corrupt the global config to trigger catch fallback in newMachineSetup
    writeFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'not-valid-json{{{', 'utf8')

    const { input, select, checkbox } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Brain identifier')) return 'corrupted-brain'
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ choices }) => {
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(checkbox).mockImplementation(async () => [])

    const { run } = await import('../../../src/commands/setup')
    await run()

    const configContent = JSON.parse(
      readFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'utf8')
    ) as { brains: Record<string, string> }
    expect(configContent.brains['corrupted-brain']).toBeDefined()
  })

  it('should handle existing brain setup (new machine) with detected AI tools', async () => {
    mkdirSync(join(tmpCwd, 'raw'), { recursive: true })
    writeFileSync(join(tmpCwd, '.graphifyignore'), '', 'utf8')
    writeFileSync(
      join(tmpCwd, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }),
      'utf8'
    )

    const { detectAll } = await import('@ai-brain/core/index')
    vi.mocked(detectAll).mockResolvedValue([
      { name: 'Claude Code', detected: true, key: 'claude', configHint: '~/.claude' },
      { name: 'Codex', detected: true, key: 'codex', configHint: '~/.codex' }
    ] as never)

    const { input, select, checkbox } = await import('@inquirer/prompts')

    vi.mocked(input).mockImplementation(async ({ message, default: defaultValue }) => {
      if (message.includes('Brain identifier')) return 'detected-tools-brain'
      return defaultValue || 'default'
    })

    vi.mocked(select).mockImplementation(async ({ choices }) => {
      return (choices[0] as { value: unknown }).value as string
    })

    vi.mocked(checkbox).mockImplementation(async () => [])

    const { run } = await import('../../../src/commands/setup')
    await run()

    const configContent = JSON.parse(
      readFileSync(join(tmpHome, '.ai-brain-tool', 'config.json'), 'utf8')
    ) as { brains: Record<string, string> }
    expect(configContent.brains['detected-tools-brain']).toBeDefined()
  })
})
