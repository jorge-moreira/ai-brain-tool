import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/commands/setup.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/commands/update.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/commands/status.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/commands/upgrade.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/commands/list.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/commands/setup-obsidian.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/commands/templates/add.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/commands/templates/list.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

describe('cli entry point (src/index.ts)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { program } = await import('commander')
    vi.spyOn(program, 'parse').mockImplementation(() => program as never)
  })

  it('should register setup command', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    const commands = program.commands.map(c => c.name())
    expect(commands).toContain('setup')
  })

  it('should register update command', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    const commands = program.commands.map(c => c.name())
    expect(commands).toContain('update')
  })

  it('should register status command', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    const commands = program.commands.map(c => c.name())
    expect(commands).toContain('status')
  })

  it('should register list command', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    const commands = program.commands.map(c => c.name())
    expect(commands).toContain('list')
  })

  it('should register upgrade command', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    const commands = program.commands.map(c => c.name())
    expect(commands).toContain('upgrade')
  })

  it('should register setup-obsidian command', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    const commands = program.commands.map(c => c.name())
    expect(commands).toContain('setup-obsidian')
  })

  it('should register templates as a parent command with add and list subcommands', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    const templates = program.commands.find(c => c.name() === 'templates')
    expect(templates).toBeDefined()

    if (templates) {
      const subCommands = templates.commands.map(c => c.name())
      expect(subCommands).toContain('list')
      expect(subCommands).toContain('add')
    }
  })

  it('should set correct program name and description', async () => {
    await import('../../src/index')

    const { program } = await import('commander')
    expect(program.name()).toBe('ai-brain')
    expect(program.description()).toContain('AI memory')
  })

  it('should configure commands with correct arguments and options', async () => {
    await import('../../src/index')

    const { program } = await import('commander')

    const updateCmd = program.commands.find(c => c.name() === 'update')
    expect(updateCmd).toBeDefined()

    const statusCmd = program.commands.find(c => c.name() === 'status')
    expect(statusCmd).toBeDefined()

    // verify commander parses without throwing for non-help args
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    program.parse(['node', 'ai-brain'], { from: 'user' })
    expect(processExitSpy).not.toHaveBeenCalled()
    processExitSpy.mockRestore()
  })
})
