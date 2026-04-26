#!/usr/bin/env node
/**
 * E2E Test: ai-brain setup and update
 * 
 * This test simulates the real user flow:
 * 1. Install dependencies
 * 2. Create brain folder structure
 * 3. Install graphify (via tool's graphify module)
 * 4. Add test content
 * 5. Run update to build knowledge graph
 * 6. Verify graph.json was created
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd();
const TEMP_DIR = join(tmpdir(), `ai-brain-e2e-${Date.now()}`);
const BRAIN_PATH = join(TEMP_DIR, 'brain');

console.log('=== E2E Test: ai-brain setup and update ===');
console.log(`Temp directory: ${TEMP_DIR}`);
console.log(`Brain path: ${BRAIN_PATH}`);

try {
  // Step 1: Install dependencies
  console.log('\nStep 1: Installing tool dependencies...');
  execSync('bun install', { cwd: REPO_PATH, stdio: 'inherit' });

  // Step 2: Create brain structure manually (simulates what setup does)
  console.log('\nStep 2: Creating brain folder structure...');
  mkdirSync(join(BRAIN_PATH, 'raw', 'notes'), { recursive: true });
  mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true });
  mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_custom'), { recursive: true });
  mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true });
  mkdirSync(join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_custom'), { recursive: true });
  mkdirSync(join(BRAIN_PATH, 'graphify-out'), { recursive: true });

  // Create brain config
  writeFileSync(
    join(BRAIN_PATH, '.brain-config.json'),
    JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }, null, 2)
  );

  // Create global config
  const globalConfigDir = join(process.env.HOME || tmpdir(), '.ai-brain-tool');
  mkdirSync(globalConfigDir, { recursive: true });
  writeFileSync(
    join(globalConfigDir, 'config.json'),
    JSON.stringify({ brains: { test: BRAIN_PATH } }, null, 2)
  );

  // Copy bundled templates
  const { cpSync } = await import('fs')
  const templatesSrc = join(REPO_PATH, 'src', 'templates')
  try {
    cpSync(join(templatesSrc, 'markdown', '_bundled'), join(BRAIN_PATH, 'raw', 'templates', 'markdown', '_bundled'), { recursive: true, force: true })
    cpSync(join(templatesSrc, 'web-clipper', '_bundled'), join(BRAIN_PATH, 'raw', 'templates', 'web-clipper', '_bundled'), { recursive: true, force: true })
  } catch (e) {
    console.log('Warning: Could not copy templates, continuing without them')
  }

  // Step 3: Install graphify using the tool's graphify module
  console.log('\nStep 3: Installing graphify (this is what ai-brain setup does)...');
  const graphifyScript = `
    import { createVenv } from '${join(REPO_PATH, 'src', 'graphify.js')}';
    await createVenv('${BRAIN_PATH}', []);
    console.log('Graphify installed successfully');
  `;
  execSync(`node -e "${graphifyScript.replace(/\n/g, '')}"`, { stdio: 'inherit' });

  // Step 4: Add test content
  console.log('\nStep 4: Adding test content...');
  writeFileSync(
    join(BRAIN_PATH, 'raw', 'notes', 'test.md'),
    `# Test Note

This is a test note for E2E validation.

## Concepts
- Testing
- Automation
- CI/CD
`
  );

  // Step 5: Run update
  console.log('\nStep 5: Running ai-brain update...');
  execSync(`node ${join(REPO_PATH, 'bin', 'ai-brain.js')} update test`, {
    cwd: REPO_PATH,
    stdio: 'inherit',
    env: { ...process.env, __HOME__: process.env.HOME || tmpdir() }
  });

  // Step 6: Verify results
  console.log('\nStep 6: Verifying results...');
  const graphPath = join(BRAIN_PATH, 'graphify-out', 'graph.json');
  
  if (existsSync(graphPath)) {
    const graph = JSON.parse(execSync(`node -e "console.log(JSON.stringify(require('fs').readFileSync('${graphPath}')))"`, { encoding: 'utf8' }));
    const nodeCount = graph.nodes?.length || 0;
    const edgeCount = graph.edges?.length || 0;
    
    if (nodeCount > 0) {
      console.log(`\n✅ E2E PASSED: graph.json created with ${nodeCount} nodes, ${edgeCount} edges`);
      process.exit(0);
    } else {
      console.log('\n⚠️  E2E WARNING: graph.json exists but has no nodes');
      process.exit(1);
    }
  } else {
    console.log('\n❌ E2E FAILED: graph.json not found');
    console.log('\nDebug info:');
    console.log(`- Brain path: ${BRAIN_PATH}`);
    console.log(`- Venv exists: ${existsSync(join(BRAIN_PATH, '.venv', 'bin', 'python3'))}`);
    console.log('- Brain folder contents:');
    try {
      execSync(`ls -la ${BRAIN_PATH}`, { stdio: 'inherit' });
    } catch {}
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ E2E FAILED with error:', error.message);
  process.exit(1);
} finally {
  // Cleanup
  try {
    rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log(`\nCleaned up temp directory: ${TEMP_DIR}`);
  } catch (e) {
    console.log(`Warning: Could not clean up ${TEMP_DIR}: ${e.message}`);
  }
}
