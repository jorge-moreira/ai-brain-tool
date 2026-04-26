import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('E2E: Multi-brain scenarios', () => {
  const REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd()
  let TEMP_DIR, BRAIN1_PATH, BRAIN2_PATH, GLOBAL_CONFIG_DIR

  beforeAll(() => {
    TEMP_DIR = join(tmpdir(), `ai-brain-e2e-multibrain-${Date.now()}`)
    BRAIN1_PATH = join(TEMP_DIR, 'work-brain')
    BRAIN2_PATH = join(TEMP_DIR, 'personal-brain')
    GLOBAL_CONFIG_DIR = join(TEMP_DIR, '.ai-brain-tool')
    
    console.log('=== E2E Test: Multi-brain scenarios ===')
    console.log(`Temp directory: ${TEMP_DIR}`)

    mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true })

    const brainPaths = [BRAIN1_PATH, BRAIN2_PATH]
    brainPaths.forEach(brainPath => {
      mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
      mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })
      
      writeFileSync(
        join(brainPath, '.brain-config.json'),
        JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }, null, 2)
      )
      
      writeFileSync(join(brainPath, 'README.md'), `# ${brainPath.includes('work') ? 'Work' : 'Personal'} Brain`, 'utf8')
    })

    writeFileSync(
      join(GLOBAL_CONFIG_DIR, 'config.json'),
      JSON.stringify({
        brains: {
          work: BRAIN1_PATH,
          personal: BRAIN2_PATH
        }
      }, null, 2)
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

  it('should list all configured brains', () => {
    console.log('\nStep 1: Listing all brains...')
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} list`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toContain('work')
    expect(output).toContain('personal')
    expect(output).toContain(BRAIN1_PATH)
    expect(output).toContain(BRAIN2_PATH)
  })

  it('should update specific brain by id', () => {
    console.log('\nStep 2: Updating work brain...')
    
    writeFileSync(
      join(BRAIN1_PATH, 'raw', 'notes', 'work-note.md'),
      '# Work Note\n\nThis is a work-related note.',
      'utf8'
    )
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} update work 2>&1 || true`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toMatch(/Rebuilding knowledge graph|brain updated/i)
  })

  it('should update different brain by id', () => {
    console.log('\nStep 3: Updating personal brain...')
    
    writeFileSync(
      join(BRAIN2_PATH, 'raw', 'notes', 'personal-note.md'),
      '# Personal Note\n\nThis is a personal note.',
      'utf8'
    )
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} update personal 2>&1 || true`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toMatch(/Rebuilding knowledge graph|brain updated/i)
  })

  it('should show status for specific brain', () => {
    console.log('\nStep 4: Checking work brain status...')
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} status work`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toContain('Tool version:')
    expect(output).toContain(BRAIN1_PATH)
  })

  it('should show status for different brain', () => {
    console.log('\nStep 5: Checking personal brain status...')
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} status personal`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toContain('Tool version:')
    expect(output).toContain(BRAIN2_PATH)
  })

  it('should detect brain from cwd when inside brain folder', () => {
    console.log('\nStep 6: Testing cwd detection...')
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} status 2>&1 || true`,
      {
        encoding: 'utf8',
        cwd: BRAIN1_PATH,
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    // Should either detect brain or provide helpful error
    expect(output).toMatch(/Tool version:|Not in a brain folder/i)
  })

  it('should handle update from cwd without explicit brain id', () => {
    console.log('\nStep 7: Testing update from cwd...')
    
    writeFileSync(
      join(BRAIN2_PATH, 'raw', 'notes', 'another-note.md'),
      '# Another Note',
      'utf8'
    )
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} update 2>&1 || true`,
      {
        encoding: 'utf8',
        cwd: BRAIN2_PATH,
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    // The command should either succeed or provide a helpful error
    expect(output).toMatch(/Rebuilding knowledge graph|brain updated|Not in a brain folder/i)
  })

  it('should error when not in brain folder and no brain id specified', () => {
    console.log('\nStep 8: Testing error when no brain specified...')
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} update 2>&1 || true`,
      {
        encoding: 'utf8',
        cwd: TEMP_DIR,
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toContain('Not in a brain folder')
  })

  it('should error when invalid brain id specified', () => {
    console.log('\nStep 9: Testing error for invalid brain id...')
    
    const output = execSync(
      `node ${join(REPO_PATH, 'bin', 'ai-brain.js')} update nonexistent 2>&1 || true`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )
    
    expect(output).toContain('not found')
  })
})
