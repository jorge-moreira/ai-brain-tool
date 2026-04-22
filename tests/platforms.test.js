import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const tmp = mkdtempSync(join(tmpdir(), 'platform-test-'))
process.env.HOME = tmp

after(() => rmSync(tmp, { recursive: true, force: true }))

const { detectAll } = await import('../src/platforms/index.js')
const { patch: patchClaude, installAlwaysOn: claudeAlwaysOn, skillContent } = await import('../src/platforms/claude.js')
const { installAlwaysOn: opencodeAlwaysOn } = await import('../src/platforms/opencode.js')

test('detectAll returns array of platform objects', async () => {
  const results = await detectAll()
  assert.ok(Array.isArray(results))
  assert.ok(results.every(r => typeof r.name === 'string'))
  assert.ok(results.every(r => typeof r.detected === 'boolean'))
})

test('claude patch creates mcp.json with ai-brain entry', async () => {
  const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
  const claudeDir = join(fakeHome, '.claude')
  mkdirSync(claudeDir, { recursive: true })

  after(() => rmSync(fakeHome, { recursive: true, force: true }))

  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

  const mcpPath = join(claudeDir, 'mcp.json')
  assert.ok(existsSync(mcpPath))
  const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
  assert.ok(mcp.mcpServers['ai-brain'])
  assert.equal(mcp.mcpServers['ai-brain'].type, 'stdio')
})

test('claude patch merges with existing mcp.json entries', async () => {
  const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
  const claudeDir = join(fakeHome, '.claude')
  mkdirSync(claudeDir, { recursive: true })
  writeFileSync(join(claudeDir, 'mcp.json'), JSON.stringify({
    mcpServers: { 'other-server': { type: 'stdio', command: 'other' } }
  }), 'utf8')

  after(() => rmSync(fakeHome, { recursive: true, force: true }))

  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

  const mcp = JSON.parse(readFileSync(join(claudeDir, 'mcp.json'), 'utf8'))
  assert.ok(mcp.mcpServers['other-server'])  // existing entry preserved
  assert.ok(mcp.mcpServers['ai-brain'])       // new entry added
})

test('claude patch is idempotent — running twice does not duplicate entries', async () => {
  const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
  const claudeDir = join(fakeHome, '.claude')
  mkdirSync(claudeDir, { recursive: true })

  after(() => rmSync(fakeHome, { recursive: true, force: true }))

  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })
  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

  const mcp = JSON.parse(readFileSync(join(claudeDir, 'mcp.json'), 'utf8'))
  const keys = Object.keys(mcp.mcpServers)
  assert.equal(keys.filter(k => k === 'ai-brain').length, 1)
})

test('claude installAlwaysOn writes CLAUDE.md with ai-brain section', async () => {
  const brainPath = mkdtempSync(join(tmpdir(), 'brain-always-on-'))
  after(() => rmSync(brainPath, { recursive: true, force: true }))

  await claudeAlwaysOn({ brainPath })

  const claudeMd = join(brainPath, 'CLAUDE.md')
  assert.ok(existsSync(claudeMd))
  const content = readFileSync(claudeMd, 'utf8')
  assert.ok(content.includes('## ai-brain'))
})

test('claude installAlwaysOn is idempotent — does not duplicate section', async () => {
  const brainPath = mkdtempSync(join(tmpdir(), 'brain-always-on-'))
  after(() => rmSync(brainPath, { recursive: true, force: true }))

  await claudeAlwaysOn({ brainPath })
  await claudeAlwaysOn({ brainPath })

  const content = readFileSync(join(brainPath, 'CLAUDE.md'), 'utf8')
  assert.equal(content.split('## ai-brain').length - 1, 1, 'section should appear exactly once')
})

test('opencode installAlwaysOn writes AGENTS.md with ai-brain section', async () => {
  const brainPath = mkdtempSync(join(tmpdir(), 'brain-always-on-'))
  after(() => rmSync(brainPath, { recursive: true, force: true }))

  await opencodeAlwaysOn({ brainPath })

  const agentsMd = join(brainPath, 'AGENTS.md')
  assert.ok(existsSync(agentsMd))
  const content = readFileSync(agentsMd, 'utf8')
  assert.ok(content.includes('## ai-brain'))
})
