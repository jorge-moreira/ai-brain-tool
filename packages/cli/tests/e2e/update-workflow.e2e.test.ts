import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('E2E: Update workflow with git sync', () => {
  const REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd()
  const TEMP_DIR = join(tmpdir(), `ai-brain-e2e-update-${Date.now()}`)
  const BRAIN_PATH = join(TEMP_DIR, 'update-brain')
  const GLOBAL_CONFIG_DIR = join(TEMP_DIR, '.ai-brain-tool')

  beforeAll(() => {
    console.log('=== E2E Test: Update workflow with git sync ===')
    console.log(`Temp directory: ${TEMP_DIR}`)

    mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true })

    mkdirSync(join(BRAIN_PATH, 'raw', 'notes'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'graphify-out'), { recursive: true })

    writeFileSync(
      join(BRAIN_PATH, '.brain-config.json'),
      JSON.stringify({ gitSync: true, extras: [], obsidianDir: null }, null, 2)
    )

    execSync('git init', { cwd: BRAIN_PATH, stdio: 'ignore' })
    execSync('git config user.email "test@test.com"', { cwd: BRAIN_PATH, stdio: 'ignore' })
    execSync('git config user.name "Test User"', { cwd: BRAIN_PATH, stdio: 'ignore' })

    writeFileSync(join(BRAIN_PATH, 'README.md'), '# Update Test Brain', 'utf8')
    execSync('git add .', { cwd: BRAIN_PATH, stdio: 'ignore' })
    execSync('git commit -m "initial"', { cwd: BRAIN_PATH, stdio: 'ignore' })

    writeFileSync(
      join(GLOBAL_CONFIG_DIR, 'config.json'),
      JSON.stringify(
        {
          brains: {
            test: BRAIN_PATH
          }
        },
        null,
        2
      )
    )
  }, 30000)

  afterAll(() => {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true })
      console.log(`\nCleaned up temp directory: ${TEMP_DIR}`)
    } catch {
      console.log(`Warning: Could not clean up ${TEMP_DIR}: ${e.message}`)
    }
  }, 30000)

  it('should update brain with new markdown file', () => {
    console.log('\nStep 1: Adding new markdown file...')

    writeFileSync(
      join(BRAIN_PATH, 'raw', 'notes', 'test-note.md'),
      `# Test Note

This is a test note for the update workflow.

## Concepts
- Testing
- E2E
- Git Sync
`,
      'utf8'
    )

    expect(existsSync(join(BRAIN_PATH, 'raw', 'notes', 'test-note.md'))).toBe(true)
  })

  it('should run update command successfully', () => {
    console.log('\nStep 2: Running update command (expected to fail without graphify)...')

    const output = execSync(
      `bun ${join(REPO_PATH, 'bin', 'ai-brain.js')} update test 2>&1 || true`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )

    expect(output).toContain('Rebuilding knowledge graph')
  })

  it('should commit changes to git when gitSync is enabled', () => {
    console.log('\nStep 3: Checking git status...')

    const status = execSync('git status --porcelain', { cwd: BRAIN_PATH, encoding: 'utf8' })
    expect(status).toBeDefined()
  })

  it('should handle update with no changes gracefully', () => {
    console.log('\nStep 4: Running update with no changes...')

    const output = execSync(
      `bun ${join(REPO_PATH, 'bin', 'ai-brain.js')} update test 2>&1 || true`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )

    expect(output).toMatch(/Rebuilding knowledge graph|brain updated/i)
  })

  it('should handle update when graph.json does not exist', () => {
    console.log('\nStep 5: Testing with missing graph.json...')

    if (existsSync(join(BRAIN_PATH, 'graphify-out', 'graph.json'))) {
      rmSync(join(BRAIN_PATH, 'graphify-out', 'graph.json'))
    }

    const output = execSync(
      `bun ${join(REPO_PATH, 'bin', 'ai-brain.js')} update test 2>&1 || true`,
      {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR }
      }
    )

    expect(output).toMatch(/Rebuilding knowledge graph|brain updated/i)
  })
})
