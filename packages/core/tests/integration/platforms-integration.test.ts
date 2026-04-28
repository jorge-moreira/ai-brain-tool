import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  PathLike
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { detectAll, configureSelected } from '@ai-brain/core/index'
import {
  detect as detectClaude,
  patch as patchClaude,
  installSkill as installSkillClaude
} from '@ai-brain/core/platforms/claude'
import {
  detect as detectOpencode,
  patch as patchOpencode,
  installSkill as installSkillOpencode
} from '@ai-brain/core/platforms/opencode'
import {
  detect as detectCursor,
  patch as patchCursor,
  installSkill as installSkillCursor
} from '@ai-brain/core/platforms/cursor'
import {
  detect as detectGemini,
  patch as patchGemini,
  installSkill as installSkillGemini
} from '@ai-brain/core/platforms/gemini'
import {
  detect as detectCopilot,
  patch as patchCopilot,
  installSkill as installSkillCopilot
} from '@ai-brain/core/platforms/copilot'
import {
  detect as detectCodex,
  patch as patchCodex,
  installSkill as installSkillCodex
} from '@ai-brain/core/platforms/codex'

describe('platforms integration', () => {
  let tmpHome: PathLike

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
      mkdirSync(join(tmpHome.toString(), '.claude'), { recursive: true })
      expect(detectClaude(tmpHome.toString())).toBe(true)
    })

    it('should patch claude mcp.json with ai-brain server', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.claude'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')

      await patchClaude({ brainPath, homeDir: tmpHome.toString() })

      const mcpPath = join(tmpHome.toString(), '.claude', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)

      const config = JSON.parse(readFileSync(mcpPath, 'utf8'))
      expect(config.mcpServers['ai-brain']).toBeDefined()
      expect(config.mcpServers['ai-brain'].command).toContain('.venv/bin/python3')
      expect(config.mcpServers['ai-brain'].args).toContain('-m')
      expect(config.mcpServers['ai-brain'].args).toContain('graphify.serve')
    })

    it('should install brain.md skill file', async () => {
      await installSkillClaude({ homeDir: tmpHome.toString() })

      const skillPath = join(tmpHome.toString(), '.claude', 'commands', 'brain.md')
      expect(existsSync(skillPath)).toBe(true)

      const content = readFileSync(skillPath, 'utf8')
      expect(content.length).toBeGreaterThan(0)
    })
  })

  describe('opencode platform', () => {
    it('should detect opencode when .config/opencode dir exists', async () => {
      mkdirSync(join(tmpHome.toString(), '.config', 'opencode'), { recursive: true })
      expect(detectOpencode(tmpHome.toString())).toBe(true)
    })

    it('should patch opencode.json with ai-brain mcp entry', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.config', 'opencode'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')

      await patchOpencode({ brainPath, homeDir: tmpHome.toString() })

      const configPath = join(tmpHome.toString(), '.config', 'opencode', 'opencode.json')
      expect(existsSync(configPath)).toBe(true)

      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      expect(config.mcp['ai-brain']).toBeDefined()
      expect(config.mcp['ai-brain'].type).toBe('local')
    })

    it('should install SKILL.md to skills/brain directory', async () => {
      await installSkillOpencode({ homeDir: tmpHome.toString() })

      const skillPath = join(
        tmpHome.toString(),
        '.config',
        'opencode',
        'skills',
        'brain',
        'SKILL.md'
      )
      expect(existsSync(skillPath)).toBe(true)

      const content = readFileSync(skillPath, 'utf8')
      expect(content.length).toBeGreaterThan(0)
    })
  })

  describe('cursor platform', () => {
    it('should detect cursor when .cursor dir exists', async () => {
      mkdirSync(join(tmpHome.toString(), '.cursor'), { recursive: true })
      expect(detectCursor(tmpHome.toString())).toBe(true)
    })

    it('should patch cursor mcp.json with ai-brain server', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.cursor'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')

      await patchCursor({ brainPath, homeDir: tmpHome.toString() })

      const mcpPath = join(tmpHome.toString(), '.cursor', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(true)

      const config = JSON.parse(readFileSync(mcpPath, 'utf8'))
      expect(config.mcpServers['ai-brain']).toBeDefined()
    })

    it('should install brain.mdc rule file', async () => {
      await installSkillCursor({ homeDir: tmpHome.toString() })

      const skillPath = join(tmpHome.toString(), '.cursor', 'rules', 'brain.mdc')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('gemini platform', () => {
    it('should detect gemini when .gemini dir exists', async () => {
      mkdirSync(join(tmpHome.toString(), '.gemini'), { recursive: true })
      expect(detectGemini(tmpHome.toString())).toBe(true)
    })

    it('should patch gemini settings.json with ai-brain mcp server', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.gemini'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')

      await patchGemini({ brainPath, homeDir: tmpHome.toString() })

      const settingsPath = join(tmpHome.toString(), '.gemini', 'settings.json')
      expect(existsSync(settingsPath)).toBe(true)

      const config = JSON.parse(readFileSync(settingsPath, 'utf8'))
      expect(config.mcpServers).toBeDefined()
      expect(config.mcpServers['ai-brain']).toBeDefined()
    })

    it('should install SKILL.md skill file', async () => {
      await installSkillGemini({ homeDir: tmpHome.toString() })

      const skillPath = join(tmpHome.toString(), '.gemini', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('copilot platform', () => {
    it('should detect copilot when .config/gh dir exists', async () => {
      mkdirSync(join(tmpHome.toString(), '.config', 'gh'), { recursive: true })
      expect(detectCopilot(tmpHome.toString())).toBe(true)
    })

    it('should skip patch (Copilot uses skills only)', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.config', 'gh'), { recursive: true })

      await patchCopilot({ brainPath, homeDir: tmpHome.toString() })

      const mcpPath = join(tmpHome.toString(), '.config', 'gh', 'copilot', 'mcp.json')
      expect(existsSync(mcpPath)).toBe(false)
    })

    it('should install SKILL.md skill file', async () => {
      await installSkillCopilot({ homeDir: tmpHome.toString() })

      const skillPath = join(tmpHome.toString(), '.copilot', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('codex platform', () => {
    it('should detect codex when .codex dir exists', async () => {
      mkdirSync(join(tmpHome.toString(), '.codex'), { recursive: true })
      expect(detectCodex(tmpHome.toString())).toBe(true)
    })

    it('should patch codex config.toml with ai-brain mcp server', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.codex'), { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')

      await patchCodex({ brainPath, homeDir: tmpHome.toString() })

      const configPath = join(tmpHome.toString(), '.codex', 'config.toml')
      expect(existsSync(configPath)).toBe(true)

      const content = readFileSync(configPath, 'utf8')
      expect(content).toContain('[mcp_servers.ai-brain]')
      expect(content).toContain('graphify.serve')
    })

    it('should install SKILL.md skill file', async () => {
      await installSkillCodex({ homeDir: tmpHome.toString() })

      const skillPath = join(tmpHome.toString(), '.codex', 'skills', 'brain', 'SKILL.md')
      expect(existsSync(skillPath)).toBe(true)
    })
  })

  describe('platforms/index', () => {
    it('should detect all platforms', async () => {
      mkdirSync(join(tmpHome.toString(), '.claude'), { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.config', 'opencode'), { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.cursor'), { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.gemini'), { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.config', 'gh'), { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.codex'), { recursive: true })

      const platforms = await detectAll(tmpHome.toString())

      expect(platforms.length).toBe(6)
      platforms.forEach(p => {
        expect(p.detected).toBe(true)
      })
    })

    it('should configure selected platforms', async () => {
      const brainPath = join(tmpHome.toString(), 'brain')
      mkdirSync(brainPath, { recursive: true })
      mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
      writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')

      mkdirSync(join(tmpHome.toString(), '.claude'), { recursive: true })
      mkdirSync(join(tmpHome.toString(), '.config', 'opencode'), { recursive: true })

      const platforms = await detectAll(tmpHome.toString())
      const selected = platforms.filter(p => p.key === 'claude' || p.key === 'opencode')

      await configureSelected({ selected, brainPath, homeDir: tmpHome.toString() })

      const claudeMcpPath = join(tmpHome.toString(), '.claude', 'mcp.json')
      const opencodeConfigPath = join(tmpHome.toString(), '.config', 'opencode', 'opencode.json')

      expect(existsSync(claudeMcpPath)).toBe(true)
      expect(existsSync(opencodeConfigPath)).toBe(true)
    })
  })
})
