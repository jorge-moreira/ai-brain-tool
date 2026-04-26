import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd()
const TEMP_DIR = join(tmpdir(), `ai-brain-e2e-${Date.now()}`)
const BRAIN_PATH = join(TEMP_DIR, 'brain')
const GLOBAL_CONFIG_DIR = join(process.env.HOME || tmpdir(), '.ai-brain-tool')

describe('E2E: ai-brain setup and update', () => {
  beforeAll(() => {
    console.log('=== E2E Test: ai-brain setup and update ===')
    console.log(`Temp directory: ${TEMP_DIR}`)
    console.log(`Brain path: ${BRAIN_PATH}`)

    // Step 1: Create brain folder structure
    console.log('\nStep 1: Creating brain folder structure...')
    mkdirSync(join(BRAIN_PATH, 'raw', 'notes'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_custom'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_custom'), { recursive: true })
    mkdirSync(join(BRAIN_PATH, 'graphify-out'), { recursive: true })

    // Create brain config
    writeFileSync(
      join(BRAIN_PATH, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }, null, 2)
    )

    // Create global config
    mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true })
    writeFileSync(
      join(GLOBAL_CONFIG_DIR, 'config.json'),
      JSON.stringify({ brains: { test: BRAIN_PATH } }, null, 2)
    )

    // Copy bundled templates
    const templatesSrc = join(REPO_PATH, 'src', 'templates')
    try {
      cpSync(join(templatesSrc, 'markdown', '_bundled'), join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true, force: true })
      cpSync(join(templatesSrc, 'web-clipper', '_bundled'), join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true, force: true })
    } catch (e) {
      console.log('Warning: Could not copy templates, continuing without them')
    }

    // Step 2: Install graphify
    console.log('\nStep 2: Installing graphify...')
    const graphifyScript = `
      import { createVenv } from '${join(REPO_PATH, 'src', 'graphify.js')}';
      await createVenv('${BRAIN_PATH}', []);
    `
    execSync(`node -e "${graphifyScript.replace(/\n/g, '')}"`, { stdio: 'inherit' })

    // Step 3: Add test content
    console.log('\nStep 3: Adding test content...')
    writeFileSync(
      join(BRAIN_PATH, 'raw', 'notes', 'test.md'),
      `# Test Note

This is a test note for E2E validation.

## Concepts
- Testing
- Automation
- CI/CD
`
    )
  }, 120000)

  afterAll(() => {
    // Cleanup
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true })
      console.log(`\nCleaned up temp directory: ${TEMP_DIR}`)
    } catch (e) {
      console.log(`Warning: Could not clean up ${TEMP_DIR}: ${e.message}`)
    }
  })

  it('should build knowledge graph with ai-brain update', () => {
    console.log('\nStep 4: Running ai-brain update...')
    execSync(`node ${join(REPO_PATH, 'bin', 'ai-brain.js')} update test`, {
      cwd: REPO_PATH,
      stdio: 'inherit',
      env: { ...process.env, __HOME__: process.env.HOME || tmpdir() }
    })
  }, 60000)

  it('should create graph.json with nodes and edges', () => {
    console.log('\nStep 5: Verifying results...')
    const graphPath = join(BRAIN_PATH, 'graphify-out', 'graph.json')
    
    expect(existsSync(graphPath)).toBe(true)

    const graph = JSON.parse(execSync(`node -e "console.log(JSON.stringify(require('fs').readFileSync('${graphPath}')))"`, { encoding: 'utf8' }))
    const nodeCount = graph.nodes?.length || 0
    const edgeCount = graph.edges?.length || 0
    
    console.log(`✅ E2E PASSED: graph.json created with ${nodeCount} nodes, ${edgeCount} edges`)
    
    expect(nodeCount).toBeGreaterThan(0)
    expect(edgeCount).toBeGreaterThan(0)
  })
})
