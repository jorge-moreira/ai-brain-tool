import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { run } from '../../../src/commands/setup-obsidian'
import { createBrainWithConfig, cleanupBrain } from '../../helpers'

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ vaultPath: '/default-vault' })
  }
}))

describe('setup-obsidian integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should configure obsidian vault at brain path', async () => {
    const result = createBrainWithConfig('test-brain')
    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: result.brainPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(result.brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(result.brainPath)
    expect(existsSync(join(result.brainPath, '.obsidian'))).toBe(true)
    cleanupBrain(result)
  })

  it('should configure obsidian vault at custom path', async () => {
    const result = createBrainWithConfig('test-brain')
    const customVaultPath = join(result.tmpHome, 'custom-vault')
    mkdirSync(customVaultPath, { recursive: true })

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: customVaultPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(result.brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(customVaultPath)
    expect(existsSync(join(customVaultPath, '.obsidian'))).toBe(true)
    cleanupBrain(result)
  })

  it('should show existing vault configuration without update flag', async () => {
    const result = createBrainWithConfig('test-brain')
    const existingVault = join(result.tmpHome, 'existing-vault')
    mkdirSync(existingVault, { recursive: true })
    writeFileSync(
      join(result.brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: existingVault }),
      'utf8'
    )

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Vault already configured'))
    cleanupBrain(result)
  })

  it('should update vault configuration with --update flag', async () => {
    const result = createBrainWithConfig('test-brain')
    const oldVault = join(result.tmpHome, 'old-vault')
    writeFileSync(
      join(result.brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: oldVault }),
      'utf8'
    )
    const newVaultPath = join(result.tmpHome, 'new-vault')
    mkdirSync(newVaultPath, { recursive: true })

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: newVaultPath })

    await run(['test-brain', '--update'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(result.brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(newVaultPath)
    cleanupBrain(result)
  })

  it('should update vault configuration with -u flag', async () => {
    const result = createBrainWithConfig('test-brain')
    const oldVault = join(result.tmpHome, 'old-vault')
    writeFileSync(
      join(result.brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: oldVault }),
      'utf8'
    )
    const newVaultPath = join(result.tmpHome, 'new-vault-short')
    mkdirSync(newVaultPath, { recursive: true })

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: newVaultPath })

    await run(['test-brain', '-u'], { brainId: 'test-brain' })

    const configContent = JSON.parse(
      readFileSync(join(result.brainPath, '.brain-config.json'), 'utf8')
    ) as { obsidianDir: string }
    expect(configContent.obsidianDir).toBe(newVaultPath)
    cleanupBrain(result)
  })

  it('should create vault directory if it does not exist', async () => {
    const result = createBrainWithConfig('test-brain')
    const newVaultPath = join(result.tmpHome, 'nonexistent-vault')

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath: newVaultPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    expect(existsSync(newVaultPath)).toBe(true)
    expect(existsSync(join(newVaultPath, '.obsidian'))).toBe(true)
    cleanupBrain(result)
  })

  it('should not overwrite existing .obsidian directory', async () => {
    const result = createBrainWithConfig('test-brain')
    const vaultPath = join(result.tmpHome, 'existing-obsidian-vault')
    const obsidianDir = join(vaultPath, '.obsidian')
    mkdirSync(obsidianDir, { recursive: true })
    writeFileSync(join(obsidianDir, 'custom.json'), 'custom content', 'utf8')

    const inquirer = await import('inquirer')
    vi.mocked(inquirer.default.prompt).mockResolvedValue({ vaultPath })

    await run(['test-brain'], { brainId: 'test-brain' })

    const customContent = readFileSync(join(obsidianDir, 'custom.json'), 'utf8')
    expect(customContent).toBe('custom content')
    cleanupBrain(result)
  })

  it('should throw error when brain is not configured', async () => {
    const result = createBrainWithConfig('empty')
    // clear brains from config
    writeFileSync(
      join(result.tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )

    await expect(run(['nonexistent-brain'], { brainId: 'nonexistent-brain' })).rejects.toThrow(
      'BRAIN_NOT_RESOLVED'
    )
    cleanupBrain(result)
  })
})
