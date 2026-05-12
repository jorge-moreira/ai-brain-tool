import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import type { Command } from 'commander'
import type { MockedFunction } from 'vitest'

const mockSetupRun = vi.fn().mockResolvedValue(undefined)
const mockUpdateRun = vi.fn().mockResolvedValue(undefined)
const mockStatusRun = vi.fn().mockResolvedValue(undefined)
const mockUpgradeRun = vi.fn().mockResolvedValue(undefined)
const mockListRun = vi.fn().mockResolvedValue(undefined)
const mockSetupObsidianRun = vi.fn().mockResolvedValue(undefined)
const mockTemplatesAddRun = vi.fn().mockResolvedValue(undefined)
const mockTemplatesListRun = vi.fn().mockResolvedValue(undefined)

vi.mock('../../src/commands/setup', () => ({ run: mockSetupRun }))
vi.mock('../../src/commands/update', () => ({ run: mockUpdateRun }))
vi.mock('../../src/commands/status', () => ({ run: mockStatusRun }))
vi.mock('../../src/commands/upgrade', () => ({ run: mockUpgradeRun }))
vi.mock('../../src/commands/list', () => ({ run: mockListRun }))
vi.mock('../../src/commands/setup-obsidian', () => ({ run: mockSetupObsidianRun }))
vi.mock('../../src/commands/templates/add', () => ({ run: mockTemplatesAddRun }))
vi.mock('../../src/commands/templates/list', () => ({ run: mockTemplatesListRun }))

describe('cli entry point (src/index.ts)', () => {
  let program: Command
  let exitSpy: MockedFunction<typeof process.exit>

  beforeAll(async () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    await import('../../src/index')
    const { program: p } = await import('commander')
    program = p as Command
  })

  afterAll(() => {
    exitSpy.mockRestore()
  })

  it('should have correct name, description, version', () => {
    expect(program.name()).toBe('ai-brain')
    expect(program.description()).toContain('AI memory')
    expect(program.version()).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('should register all commands', () => {
    const names = program.commands.map(c => c.name())
    expect(names).toContain('setup')
    expect(names).toContain('update')
    expect(names).toContain('status')
    expect(names).toContain('upgrade')
    expect(names).toContain('list')
    expect(names).toContain('setup-obsidian')
    expect(names).toContain('templates')
  })

  it('should register templates subcommands', () => {
    const templates = program.commands.find(c => c.name() === 'templates') as Command | undefined
    expect(templates).toBeDefined()
    if (!templates) return
    const subNames = templates.commands.map(c => c.name())
    expect(subNames).toContain('list')
    expect(subNames).toContain('add')
  })

  it('should invoke setup action via parseAsync', async () => {
    await program.parseAsync(['setup'], { from: 'user' })
    expect(mockSetupRun).toHaveBeenCalled()
  })

  it('should invoke update action via parseAsync', async () => {
    await program.parseAsync(['update', 'my-brain'], { from: 'user' })
    expect(mockUpdateRun).toHaveBeenCalledWith(['my-brain'], expect.any(Object))
  })

  it('should invoke status action via parseAsync', async () => {
    await program.parseAsync(['status', 'my-brain'], { from: 'user' })
    expect(mockStatusRun).toHaveBeenCalledWith(['my-brain'], expect.any(Object))
  })

  it('should invoke list action via parseAsync', async () => {
    await program.parseAsync(['list'], { from: 'user' })
    expect(mockListRun).toHaveBeenCalled()
  })

  it('should invoke templates list action via parseAsync', async () => {
    await program.parseAsync(['templates', 'list', 'my-brain'], { from: 'user' })
    expect(mockTemplatesListRun).toHaveBeenCalledWith(['my-brain'], expect.any(Object))
  })

  it('should invoke templates add action via parseAsync', async () => {
    await program.parseAsync(['templates', 'add', 'my-brain'], { from: 'user' })
    expect(mockTemplatesAddRun).toHaveBeenCalledWith(['my-brain'], expect.any(Object))
  })

  it('should invoke upgrade action via parseAsync', async () => {
    await program.parseAsync(['upgrade', 'my-brain'], { from: 'user' })
    expect(mockUpgradeRun).toHaveBeenCalledWith(['my-brain'], expect.any(Object))
  })

  it('should invoke setup-obsidian action via parseAsync', async () => {
    await program.parseAsync(['setup-obsidian', 'my-brain'], { from: 'user' })
    expect(mockSetupObsidianRun).toHaveBeenCalledWith(['my-brain'], expect.any(Object))
  })

  it('should invoke setup-obsidian with --update via parseAsync', async () => {
    await program.parseAsync(['setup-obsidian', 'my-brain', '--update'], { from: 'user' })
    expect(mockSetupObsidianRun).toHaveBeenCalledWith(['my-brain', '--update'], expect.any(Object))
  })
})
