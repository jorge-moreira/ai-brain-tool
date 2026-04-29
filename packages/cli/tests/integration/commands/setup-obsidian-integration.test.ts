import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { run } from '../../../src/commands/setup-obsidian'

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ vaultPath: '/default-vault' })
  }
}))

describe('setup-obsidian integration', () => {
  let tmpHome: string
  let originalHome: string | undefined
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-obsidian-test-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome

    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  function createBrainWithConfig(brainName: string, config = {}) {
    const brainPath = join(tmpHome, brainName)
    mkdirSync(brainPath, { recursive: true })

    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null, ...config }),
      'utf8'
    )

    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: { [brainName]: brainPath } }),
      'utf8'
    )

    return { brainPath }
  }

  it('should configure obsidian vault at brain path', async () => {
    const { brainPath } = createBrainWithConfig('test-brain')
    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: brainPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(brainPath)
    expect(existsSync(join(brainPath, '.obsidian'))).toBe(true)
  })

  it('should configure obsidian vault at custom path', async () => {
    const { brainPath } = createBrainWithConfig('test-brain')
    const customVaultPath = join(tmpHome, 'custom-vault')
    mkdirSync(customVaultPath, { recursive: true })

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: customVaultPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(customVaultPath)
    expect(existsSync(join(customVaultPath, '.obsidian'))).toBe(true)
  })

  it('should show existing vault configuration without update flag', async () => {
    createBrainWithConfig('test-brain', {
      obsidianDir: join(tmpHome, 'existing-vault')
    })
    mkdirSync(join(tmpHome, 'existing-vault'), { recursive: true })

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Vault already configured'))
  })

  it('should update vault configuration with --update flag', async () => {
    const { brainPath } = createBrainWithConfig('test-brain', {
      obsidianDir: join(tmpHome, 'old-vault')
    })
    const newVaultPath = join(tmpHome, 'new-vault')
    mkdirSync(newVaultPath, { recursive: true })

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: newVaultPath })

    await run(['test-brain', '--update'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(newVaultPath)
  })

  it('should update vault configuration with -u flag', async () => {
    const { brainPath } = createBrainWithConfig('test-brain', {
      obsidianDir: join(tmpHome, 'old-vault')
    })
    const newVaultPath = join(tmpHome, 'new-vault-short')
    mkdirSync(newVaultPath, { recursive: true })

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: newVaultPath })

    await run(['test-brain', '-u'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(newVaultPath)
  })

  it('should create vault directory if it does not exist', async () => {
    createBrainWithConfig('test-brain')
    const newVaultPath = join(tmpHome, 'nonexistent-vault')

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: newVaultPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(existsSync(newVaultPath)).toBe(true)
    expect(existsSync(join(newVaultPath, '.obsidian'))).toBe(true)
  })

  it('should not overwrite existing .obsidian directory', async () => {
    createBrainWithConfig('test-brain')
    const vaultPath = join(tmpHome, 'existing-obsidian-vault')
    const obsidianDir = join(vaultPath, '.obsidian')
    mkdirSync(obsidianDir, { recursive: true })
    writeFileSync(join(obsidianDir, 'custom.json'), 'custom content', 'utf8')

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: vaultPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    const customContent = readFileSync(join(obsidianDir, 'custom.json'), 'utf8')
    expect(customContent).toBe('custom content')
  })

  it('should throw error when brain is not configured', async () => {
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )

    await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow(
      'BRAIN_NOT_RESOLVED'
    )
  })
})
