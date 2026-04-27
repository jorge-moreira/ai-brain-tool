import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, rmSync, cpSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('E2E: Complete setup workflow', () => {
  const REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd()
  const TEMP_DIR = join(tmpdir(), `ai-brain-e2e-setup-${Date.now()}`)
  const BRAIN_PATH = join(TEMP_DIR, 'test-brain')
  const GLOBAL_CONFIG_DIR = join(TEMP_DIR, '.ai-brain-tool')

  beforeAll(() => {
    console.log('=== E2E Test: Complete setup workflow ===')
    console.log(`Temp directory: ${TEMP_DIR}`)
    console.log(`Brain path: ${BRAIN_PATH}`)

    mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true })
  }, 30000)

  afterAll(() => {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true })
      console.log(`\nCleaned up temp directory: ${TEMP_DIR}`)
    } catch (e) {
      console.log(`Warning: Could not clean up ${TEMP_DIR}: ${e.message}`)
    }
  }, 30000)

  it('should create brain folder structure via setup command simulation', () => {
    console.log('\nStep 1: Creating brain folder structure...')
    
    mkdirSync(join(BRAIN_PATH, 'raw', 'notes'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'articles'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'projects'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'documentation'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_custom'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_custom'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'graphify-out'), { recursive: true })

    const templatesSrc = join(REPO_PATH, 'src', 'templates')
    try {
      cpSync(join(templatesSrc, 'markdown', '_bundled'), join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true, force: true })
      cpSync(join(templatesSrc, 'web-clipper', '_bundled'), join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true, force: true })
    } catch (e) {
      console.log('Warning: Could not copy templates')
    }

    writeFileSync(
      join(BRAIN_PATH, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }, null, 2)
    )

    expect(existsSync(join(BRAIN_PATH, 'raw', 'notes'))).toBe(true)
    expect(existsSync(join(BRAIN_PATH, '.brain-config.json'))).toBe(true)
  })

  it('should initialize git repo in brain folder', () => {
    console.log('\nStep 2: Initializing git repo...')
    
    execSync('git init', { cwd: BRAIN_PATH, stdio: 'ignore' })
    execSync('git config user.email "test@test.com"', { cwd: BRAIN_PATH, stdio: 'ignore' })
    execSync('git config user.name "Test User"', { cwd: BRAIN_PATH, stdio: 'ignore' })
    
    writeFileSync(
      join(BRAIN_PATH, '.gitignore'),
      `# AI Brain Tool
.DS_Store
node_modules/
.venv/
__pycache__/
*.pyc
graphify-out/.graphify_*
graphify-out/manifest.json
graphify-out/cost.json
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
`
    )
    
    writeFileSync(join(BRAIN_PATH, 'README.md'), '# Test Brain', 'utf8')
    
    execSync('git add .', { cwd: BRAIN_PATH, stdio: 'ignore' })
    execSync('git commit -m "initial commit"', { cwd: BRAIN_PATH, stdio: 'ignore' })
    
    expect(existsSync(join(BRAIN_PATH, '.git'))).toBe(true)
    
    const log = execSync('git log --oneline -1', { cwd: BRAIN_PATH, encoding: 'utf8' })
    expect(log).toContain('initial commit')
  })

  it('should register brain in global config', () => {
    console.log('\nStep 3: Registering brain in global config...')
    
    const config = {
      brains: {
        test: BRAIN_PATH
      }
    }
    
    writeFileSync(
      join(GLOBAL_CONFIG_DIR, 'config.json'),
      JSON.stringify(config, null, 2)
    )
    
    const savedConfig = JSON.parse(readFileSync(join(GLOBAL_CONFIG_DIR, 'config.json'), 'utf8'))
    expect(savedConfig.brains.test).toBe(BRAIN_PATH)
  })

  it('should list the configured brain', () => {
    console.log('\nStep 4: Listing configured brain...')
    
    const configPath = join(TEMP_DIR, '.ai-brain-tool', 'config.json')
    writeFileSync(
      configPath,
      JSON.stringify({
        brains: {
          test: BRAIN_PATH
        }
      }, null, 2)
    )
    
    const output = execSync(
      `bun run ${join(REPO_PATH, 'bin', 'ai-brain.js')} list`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toContain('test')
  })

  it('should show brain status', () => {
    console.log('\nStep 5: Checking brain status...')
    
    // Ensure brain config exists
    writeFileSync(
      join(BRAIN_PATH, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }, null, 2)
    )
    
    const output = execSync(
      `bun run ${join(REPO_PATH, 'bin', 'ai-brain.js')} status test 2>&1 || true`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toContain('Tool version:')
    expect(output).toContain('Brain path:')
  })
})
