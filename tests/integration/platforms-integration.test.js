import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('platforms integration', () => {
  let tmpHome

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-platforms-test-'))
    process.env.__HOME__ = tmpHome
  })

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true })
    delete process.env.__HOME__
  })

  describe('claude platform', () => {
    it('should detect claude when .claude dir exists', async () => {
      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      const { detect } = await import('../../../src/platforms/claude.js')
      expect(detect(tmpHome)).toBe(true)
    })

    it('should patch claude mcp.json with ai-brain server', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
      
      const { patch } = await import('../../../src/platforms/claude.js')
      await patch({ brainPath, homeDir: tmpHome })
      
      const mcpPath = join(tmpHome, '.claude', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)
      
      const config = JSON.parse(readFileSync(mcpPath, 'utf8'))
      expect(config.mcpServers['ai-brain']).toBeDefined()
      expect(config.mcpServers['ai-brain'].command).toContain('.venv/bin/python3')
      expect(config.mcpServers['ai-brain'].args).toContain('-m')
      expect(config.mcpServers['ai-brain'].args).toContain('graphify.serve')
    })

    it('should install brain.md skill file', async () => {
      const { installSkill } = await import('../../../src/platforms/claude.js')
      await installSkill({ homeDir: tmpHome })
      
      const skillPath = join(tmpHome, '.claude', 'commands', 'brain.md')
      expect(existsSync(skillPath)).toBe(true)
      
      const content = readFileSync(skillPath, 'utf8')
      expect(content.length).toBeGreaterThan(0)
    })
  })

  describe('opencode platform', () => {
    it('should detect opencode when .config/opencode dir exists', async () => {
      mkdirSync(join(tmpHome, '.config', 'opencode'), { recursive: true })
      const { detect } = await import('../../../src/platforms/opencode.js')
      expect(detect(tmpHome)).toBe(true)
    })

    it('should patch opencode.json with ai-brain mcp entry', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.config', 'opencode'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
      
      const { patch } = await import('../../../src/platforms/opencode.js')
      await patch({ brainPath, homeDir: tmpHome })
      
      const configPath = join(tmpHome, '.config', 'opencode', 'opencode.json')
      expect(existsSync(configPath)).toBe(true)
      
      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(config.mcp['ai-brain']).toBeDefined()
      expect(config.mcp['ai-brain'].type).toBe('local')
    })

    it('should install SKILL.md to skills/brain directory', async () => {
      const { installSkill } = await import('../../../src/platforms/opencode.js')
      await installSkill({ homeDir: tmpHome })
      
      const skillPath = join(tmpHome, '.config', 'opencode', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)
      
      const content = readFileSync(skillPath, 'utf8')
      expect(content.length).toBeGreaterThan(0)
    })
  })

  describe('cursor platform', () => {
    it('should detect cursor when .cursor dir exists', async () => {
      mkdirSync(join(tmpHome, '.cursor'), { recursive: true })
      const { detect } = await import('../../../src/platforms/cursor.js')
      expect(detect(tmpHome)).toBe(true)
    })

    it('should patch cursor mcp.json with ai-brain server', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.cursor'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
      
      const { patch } = await import('../../../src/platforms/cursor.js')
      await patch({ brainPath, homeDir: tmpHome })
      
      const mcpPath = join(tmpHome, '.cursor', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)
      
      const config = JSON.parse(readFileSync(mcpPath, 'utf8'))
      expect(config.mcpServers['ai-brain']).toBeDefined()
    })

    it('should install brain.mdc rule file', async () => {
      const { installSkill } = await import('../../../src/platforms/cursor.js')
      await installSkill({ homeDir: tmpHome })
      
      const skillPath = join(tmpHome, '.cursor', 'rules', 'brain.mdc')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('gemini platform', () => {
    it('should detect gemini when .gemini dir exists', async () => {
      mkdirSync(join(tmpHome, '.gemini'), { recursive: true })
      const { detect } = await import('../../../src/platforms/gemini.js')
      expect(detect(tmpHome)).toBe(true)
    })

    it('should patch gemini settings.json with ai-brain mcp server', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.gemini'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
      
      const { patch } = await import('../../../src/platforms/gemini.js')
      await patch({ brainPath, homeDir: tmpHome })
      
      const settingsPath = join(tmpHome, '.gemini', 'settings.json')
      expect(existsSync(settingsPath)).toBe(true)
      
      const config = JSON.parse(readFileSync(settingsPath, 'utf8'))
      expect(config.mcpServers).toBeDefined()
      expect(config.mcpServers['ai-brain']).toBeDefined()
    })

    it('should install SKILL.md skill file', async () => {
      const { installSkill } = await import('../../../src/platforms/gemini.js')
      await installSkill({ homeDir: tmpHome })
      
      const skillPath = join(tmpHome, '.gemini', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('copilot platform', () => {
    it('should detect copilot when .config/gh dir exists', async () => {
      mkdirSync(join(tmpHome, '.config', 'gh'), { recursive: true })
      const { detect } = await import('../../../src/platforms/copilot.js')
      expect(detect(tmpHome)).toBe(true)
    })

    it('should skip patch (Copilot uses skills only)', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.config', 'gh'), { recursive: true })
      
      const { patch } = await import('../../../src/platforms/copilot.js')
      await patch({ brainPath, homeDir: tmpHome })
      
      const mcpPath = join(tmpHome, '.config', 'gh', 'copilot', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(false)
    })

    it('should install SKILL.md skill file', async () => {
      const { installSkill } = await import('../../../src/platforms/copilot.js')
      await installSkill({ homeDir: tmpHome })
      
      const skillPath = join(tmpHome, '.copilot', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('codex platform', () => {
    it('should detect codex when .codex dir exists', async () => {
      mkdirSync(join(tmpHome, '.codex'), { recursive: true })
      const { detect } = await import('../../../src/platforms/codex.js')
      expect(detect(tmpHome)).toBe(true)
    })

    it('should patch codex config.toml with ai-brain mcp server', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome, '.codex'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
      
      const { patch } = await import('../../../src/platforms/codex.js')
      await patch({ brainPath, homeDir: tmpHome })
      
      const configPath = join(tmpHome, '.codex', 'config.toml')
      expect(existsSync(configPath)).toBe(true)
      
      const content = readFileSync(configPath, 'utf8')
      expect(content).toContain('[mcp_servers.ai-brain]')
      expect(content).toContain('graphify.serve')
    })

    it('should install SKILL.md skill file', async () => {
      const { installSkill } = await import('../../../src/platforms/codex.js')
      await installSkill({ homeDir: tmpHome })
      
      const skillPath = join(tmpHome, '.codex', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('platforms/index', () => {
    it('should detect all platforms', async () => {
      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      mkdirSync(join(tmpHome, '.config', 'opencode'), { recursive: true })
      mkdirSync(join(tmpHome, '.cursor'), { recursive: true })
      mkdirSync(join(tmpHome, '.gemini'), { recursive: true })
      mkdirSync(join(tmpHome, '.config', 'gh'), { recursive: true })
      mkdirSync(join(tmpHome, '.codex'), { recursive: true })
      
      const { detectAll } = await import('../../../src/platforms/index.js')
      const platforms = await detectAll(tmpHome)
      
      expect(platforms.length).toBe(6)
      platforms.forEach(p => {
        expect(p.detected).toBe(true)
      })
    })

    it('should configure selected platforms', async () => {
      const brainPath = join(tmpHome, 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
      
      mkdirSync(join(tmpHome, '.claude'), { recursive: true })
      mkdirSync(join(tmpHome, '.config', 'opencode'), { recursive: true })
      
      const { detectAll, configureSelected } = await import('../../../src/platforms/index.js')
      const platforms = await detectAll(tmpHome)
      const selected = platforms.filter(p => p.key === 'claude' || p.key === 'opencode')
      
      await configureSelected({ selected, brainPath, homeDir: tmpHome })
      
      const claudeMcpPath = join(tmpHome, '.claude', 'mcp.json')
      const opencodeConfigPath = join(tmpHome, '.config', 'opencode', 'opencode.json')
      
      expect(existsSync(claudeMcpPath)).toBe(true)
      expect(existsSync(opencodeConfigPath)).toBe(true)
    })
  })
})
