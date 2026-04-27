import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('E2E: Platform MCP configuration', () => {
  const REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd()
  const TEMP_DIR = join(tmpdir(), `ai-brain-e2e-platforms-${Date.now()}`)
  const BRAIN_PATH = join(TEMP_DIR, 'platform-brain')
  const PLATFORMS_HOME = join(TEMP_DIR, 'platform-home')

  beforeAll(() => {
    console.log('=== E2E Test: Platform MCP configuration ===')
    console.log(`Temp directory: ${TEMP_DIR}`)

    mkdirSync(TEMP_DIR, { recursive: true })
    mkdirSync(PLATFORMS_HOME, { recursive: true })
    mkdirSync(BRAIN_PATH, { recursive: true })
    mkdirSync(join(BRAIN_PATH, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(BRAIN_PATH, '.venv', 'bin', 'python3'), '', 'utf8')

    mkdirSync(join(BRAIN_PATH, 'raw', 'notes'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'graphify-out'), { recursive: true })

    writeFileSync(
      join(BRAIN_PATH, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }, null, 2)
    )
  }, 30000)

  afterAll(() => {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true })
      console.log(`\nCleaned up temp directory: ${TEMP_DIR}`)
    } catch (e) {
      console.log(`Warning: Could not clean up ${TEMP_DIR}: ${e.message}`)
    }
  }, 30000)

  it('should configure Claude Code MCP', async () => {
    console.log('\nStep 1: Configuring Claude Code...')
    
    const claudeDir = join(PLATFORMS_HOME, '.claude')
    mkdirSync(claudeDir, { recursive: true })
    
    const { patch, installSkill } = await import('../../../src/platforms/claude.js')
    await patch({ brainPath: BRAIN_PATH, homeDir: PLATFORMS_HOME })
    await installSkill({ homeDir: PLATFORMS_HOME })
    
    const mcpPath = join(claudeDir, 'mcp.json')
    expect(existsSync(mcpPath)).toBe(true)
    
    const config = JSON.parse(readFileSync(mcpPath, 'utf8'))
    expect(config.mcpServers['ai-brain']).toBeDefined()
    expect(config.mcpServers['ai-brain'].command).toContain('.venv/bin/python3')
    expect(config.mcpServers['ai-brain'].args).toContain('graphify.serve')
    
    const skillPath = join(claudeDir, 'commands', 'brain.md')
    expect(existsSync(skillPath)).toBe(true)
  })

  it('should configure OpenCode MCP', async () => {
    console.log('\nStep 2: Configuring OpenCode...')
    
    const opencodeDir = join(PLATFORMS_HOME, '.config', 'opencode')
    mkdirSync(opencodeDir, { recursive: true })
    
    const { patch, installSkill } = await import('../../../src/platforms/opencode.js')
    await patch({ brainPath: BRAIN_PATH, homeDir: PLATFORMS_HOME })
    await installSkill({ homeDir: PLATFORMS_HOME })
    
    const configPath = join(opencodeDir, 'opencode.json')
    expect(existsSync(configPath)).toBe(true)
    
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    expect(config.mcp['ai-brain']).toBeDefined()
    expect(config.mcp['ai-brain'].type).toBe('local')
    
    const skillPath = join(PLATFORMS_HOME, '.config', 'opencode', 'skills', 'brain', 'SKILL.md')
    expect(existsSync(skillPath)).toBe(true)
  })

  it('should configure Cursor MCP', async () => {
    console.log('\nStep 3: Configuring Cursor...')
    
    const cursorDir = join(PLATFORMS_HOME, '.cursor')
    mkdirSync(cursorDir, { recursive: true })
    
    const { patch, installSkill } = await import('../../../src/platforms/cursor.js')
    await patch({ brainPath: BRAIN_PATH, homeDir: PLATFORMS_HOME })
    await installSkill({ homeDir: PLATFORMS_HOME })
    
    const mcpPath = join(cursorDir, 'mcp.json')
    expect(existsSync(mcpPath)).toBe(true)
    
    const config = JSON.parse(readFileSync(mcpPath, 'utf8'))
    expect(config.mcpServers['ai-brain']).toBeDefined()
    
    const skillPath = join(cursorDir, 'rules', 'brain.mdc')
    expect(existsSync(skillPath)).toBe(true)
  })

  it('should configure Gemini CLI MCP', async () => {
    console.log('\nStep 4: Configuring Gemini CLI...')
    
    const geminiDir = join(PLATFORMS_HOME, '.gemini')
    mkdirSync(geminiDir, { recursive: true })
    
    const { patch, installSkill } = await import('../../../src/platforms/gemini.js')
    await patch({ brainPath: BRAIN_PATH, homeDir: PLATFORMS_HOME })
    await installSkill({ homeDir: PLATFORMS_HOME })
    
    const settingsPath = join(geminiDir, 'settings.json')
    expect(existsSync(settingsPath)).toBe(true)
    
    const config = JSON.parse(readFileSync(settingsPath, 'utf8'))
    expect(config.mcpServers['ai-brain']).toBeDefined()
    
    const skillPath = join(geminiDir, 'skills', 'brain', 'SKILL.md')
    expect(existsSync(skillPath)).toBe(true)
  })

  it('should configure GitHub Copilot skill only (no MCP config)', async () => {
    console.log('\nStep 5: Configuring GitHub Copilot...')
    
    const copilotDir = join(PLATFORMS_HOME, '.copilot', 'skills', 'brain')
    mkdirSync(copilotDir, { recursive: true })
    
    const { installSkill } = await import('../../../src/platforms/copilot.js')
    await installSkill({ homeDir: PLATFORMS_HOME })
    
    const skillPath = join(PLATFORMS_HOME, '.copilot', 'skills', 'brain', 'SKILL.md')
    expect(existsSync(skillPath)).toBe(true)
  })

  it('should configure OpenAI Codex skill', async () => {
    console.log('\nStep 6: Configuring OpenAI Codex...')
    
    const codexDir = join(PLATFORMS_HOME, '.codex', 'skills', 'brain')
    mkdirSync(codexDir, { recursive: true })
    
    const { installSkill } = await import('../../../src/platforms/codex.js')
    await installSkill({ homeDir: PLATFORMS_HOME })
    
    const skillPath = join(codexDir, 'SKILL.md')
    expect(existsSync(skillPath)).toBe(true)
  })

  it('should configure multiple platforms simultaneously', async () => {
    console.log('\nStep 7: Configuring multiple platforms...')
    
    const { detectAll, configureSelected } = await import('../../../src/platforms/index.js')
    
    const platforms = await detectAll(PLATFORMS_HOME)
    const selected = platforms.filter(p => 
      p.key === 'claude' || p.key === 'opencode' || p.key === 'cursor'
    )
    
    await configureSelected({ selected, brainPath: BRAIN_PATH, homeDir: PLATFORMS_HOME })
    
    expect(existsSync(join(PLATFORMS_HOME, '.claude', 'mcp.json'))).toBe(true)
    expect(existsSync(join(PLATFORMS_HOME, '.config', 'opencode', 'opencode.json'))).toBe(true)
    expect(existsSync(join(PLATFORMS_HOME, '.cursor', 'mcp.json'))).toBe(true)
  })
})