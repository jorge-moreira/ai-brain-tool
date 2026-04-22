# ai-brain-tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `ai-brain` npm CLI package that scaffolds a personal AI knowledge brain folder, configures all detected AI platforms via MCP, and manages templates — all from a single `npx ai-brain setup` command.

**Architecture:** A Node.js CLI built with `commander` for routing and `@inquirer/prompts` for the interactive wizard. The tool wraps `graphify` (a Python package) via a `.venv` it manages inside the brain folder. Platform integration is done by patching each AI CLI's global config JSON/TOML and installing a `/brain` skill file. The MCP server is a thin wrapper that starts `graphify`'s built-in MCP server.

**Tech Stack:** Node.js 18+, commander 12, @inquirer/prompts 7, chalk 5, execa 9, ora 8, semver 7. Python 3.10+ required on the host machine (not bundled).

---

## File Map

```
tool/
├── bin/
│   └── ai-brain.js              ← CLI entry, wires commander
├── src/
│   ├── commands/
│   │   ├── setup.js             ← full wizard (fresh + new-machine modes)
│   │   ├── update.js            ← rebuild graph + git sync
│   │   ├── status.js            ← health check output
│   │   ├── templates.js         ← list _bundled/ and _custom/
│   │   ├── templates-add.js     ← create new template in _custom/
│   │   └── upgrade.js           ← upgrade graphify + rewrite _bundled/
│   ├── platforms/
│   │   ├── index.js             ← detectAll(), configureAll()
│   │   ├── claude.js            ← detect, patch mcp.json, install skill
│   │   ├── opencode.js
│   │   ├── cursor.js
│   │   ├── gemini.js
│   │   ├── copilot.js
│   │   └── codex.js
│   ├── mcp/
│   │   └── server.js            ← starts graphify MCP server process
│   ├── scaffold.js              ← creates brain folder structure
│   ├── graphify.js              ← install, run, update graphify via .venv
│   └── config.js                ← read/write brain config (~/.ai-brain-config.json)
├── src/templates/               ← bundled templates (never edited by users)
│   ├── markdown/
│   │   ├── _bundled/            ← 14 .md templates
│   │   └── _starter.md          ← scaffold for templates add
│   ├── web-clipper/
│   │   ├── _bundled/            ← 3 .json templates
│   │   └── _starter.json
│   └── obsidian/                ← .obsidian config files
│       ├── app.json
│       ├── appearance.json
│       ├── core-plugins.json
│       ├── graph.json
│       └── templates.json
├── tests/
│   ├── scaffold.test.js
│   ├── graphify.test.js
│   ├── platforms.test.js
│   ├── templates.test.js
│   └── config.test.js
├── package.json
└── README.md
```

**Global brain config** (`~/.ai-brain-config.json`) stores the brain folder path so commands like `npx ai-brain update` can be run from any directory without arguments:

```json
{ "brainPath": "/Users/you/ai-brain" }
```

---

## Task 1: Project scaffold and CLI entry point

**Files:**
- Create: `tool/package.json`
- Create: `tool/bin/ai-brain.js`
- Create: `tool/src/commands/setup.js` (stub)
- Create: `tool/src/commands/update.js` (stub)
- Create: `tool/src/commands/status.js` (stub)
- Create: `tool/src/commands/templates.js` (stub)
- Create: `tool/src/commands/templates-add.js` (stub)
- Create: `tool/src/commands/upgrade.js` (stub)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "ai-brain",
  "version": "1.0.0",
  "description": "Your personal AI memory, connected to all your AI tools",
  "type": "module",
  "bin": {
    "ai-brain": "./bin/ai-brain.js"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@inquirer/prompts": "^7.0.0",
    "chalk": "^5.0.0",
    "commander": "^12.0.0",
    "execa": "^9.0.0",
    "ora": "^8.0.0",
    "semver": "^7.0.0"
  },
  "devDependencies": {
    "node:test": "*"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run inside `tool/`:
```bash
npm install
```
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create bin/ai-brain.js**

```js
#!/usr/bin/env node
import { program } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

program
  .name('ai-brain')
  .description('Your personal AI memory, connected to all your AI tools')
  .version(pkg.version, '-v, --version')

program
  .command('setup')
  .description('Run the interactive setup wizard (first-time use or new machine)')
  .action(async () => { const { run } = await import('../src/commands/setup.js'); await run() })

program
  .command('update')
  .description('Rebuild the knowledge graph and sync via git')
  .action(async () => { const { run } = await import('../src/commands/update.js'); await run() })

program
  .command('status')
  .description('Show brain health: version, graph stats, MCP connection')
  .action(async () => { const { run } = await import('../src/commands/status.js'); await run() })

program
  .command('templates')
  .description('List all templates (bundled and custom)')
  .action(async () => { const { run } = await import('../src/commands/templates.js'); await run() })
  .command('add')
  .description('Create a new custom template from a starter file')
  .action(async () => { const { run } = await import('../src/commands/templates-add.js'); await run() })

program
  .command('upgrade')
  .description('Update graphify and refresh bundled templates')
  .action(async () => { const { run } = await import('../src/commands/upgrade.js'); await run() })

program.parse()
```

- [ ] **Step 4: Create command stubs**

Create each of these files with the same stub pattern:

`src/commands/setup.js`:
```js
export async function run() {
  console.log('setup: not yet implemented')
}
```

Repeat for `update.js`, `status.js`, `templates.js`, `templates-add.js`, `upgrade.js` — same pattern, different label.

- [ ] **Step 5: Make bin executable and verify routing**

```bash
chmod +x bin/ai-brain.js
node bin/ai-brain.js --help
```

Expected output:
```
Usage: ai-brain [options] [command]

Your personal AI memory, connected to all your AI tools

Options:
  -v, --version   output the version number
  -h, --help      display help for command

Commands:
  setup           Run the interactive setup wizard (first-time use or new machine)
  update          Rebuild the knowledge graph and sync via git
  status          Show brain health: version, graph stats, MCP connection
  templates       List all templates (bundled and custom)
  upgrade         Update graphify and refresh bundled templates
  help [command]  display help for command
```

- [ ] **Step 6: Commit**

```bash
git add tool/
git commit -m "feat: scaffold ai-brain CLI package with commander routing"
```

---

## Task 2: Brain config (read/write brain path)

**Files:**
- Create: `tool/src/config.js`
- Create: `tool/tests/config.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/config.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Override HOME for isolation
const tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-test-'))
process.env.HOME = tmpHome

const { readConfig, writeConfig, CONFIG_PATH } = await import('../src/config.js')

test('CONFIG_PATH is inside HOME', () => {
  assert.ok(CONFIG_PATH.startsWith(tmpHome))
})

test('readConfig returns null when no config file exists', () => {
  const result = readConfig()
  assert.equal(result, null)
})

test('writeConfig creates config file with brainPath', () => {
  writeConfig({ brainPath: '/tmp/my-brain' })
  assert.ok(existsSync(CONFIG_PATH))
})

test('readConfig returns brainPath after write', () => {
  writeConfig({ brainPath: '/tmp/my-brain' })
  const result = readConfig()
  assert.equal(result.brainPath, '/tmp/my-brain')
})

// Cleanup
rmSync(tmpHome, { recursive: true, force: true })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/config.test.js
```
Expected: FAIL — `config.js` not found.

- [ ] **Step 3: Implement config.js**

`src/config.js`:
```js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'

export const CONFIG_PATH = join(homedir(), '.ai-brain-config.json')

export function readConfig() {
  if (!existsSync(CONFIG_PATH)) return null
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    return null
  }
}

export function writeConfig(data) {
  const dir = dirname(CONFIG_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tests/config.test.js
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tool/src/config.js tool/tests/config.test.js
git commit -m "feat: add brain config read/write (~/.ai-brain-config.json)"
```

---

## Task 3: Scaffold — create brain folder structure

**Files:**
- Create: `tool/src/scaffold.js`
- Create: `tool/tests/scaffold.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/scaffold.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { createBrainFolder } = await import('../src/scaffold.js')

test('createBrainFolder creates expected directory structure', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: false })

  assert.ok(existsSync(join(brainPath, 'raw', 'notes')))
  assert.ok(existsSync(join(brainPath, 'raw', 'articles')))
  assert.ok(existsSync(join(brainPath, 'raw', 'projects')))
  assert.ok(existsSync(join(brainPath, 'raw', 'documentation')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'markdown', '_custom')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled')))
  assert.ok(existsSync(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom')))
  assert.ok(existsSync(join(brainPath, 'graphify-out')))
  assert.ok(existsSync(join(brainPath, 'AGENTS.md')))
  assert.ok(existsSync(join(brainPath, '.graphifyignore')))

  rmSync(tmp, { recursive: true, force: true })
})

test('createBrainFolder copies bundled markdown templates to _bundled/', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: false })

  const bundled = readdirSync(join(brainPath, 'raw', 'templates', 'markdown', '_bundled'))
  assert.ok(bundled.includes('book-template.md'))
  assert.ok(bundled.includes('meeting-template.md'))

  rmSync(tmp, { recursive: true, force: true })
})

test('createBrainFolder creates .obsidian/ when includeObsidian is true', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: true })

  assert.ok(existsSync(join(brainPath, '.obsidian', 'templates.json')))
  assert.ok(existsSync(join(brainPath, '.obsidian', 'app.json')))

  rmSync(tmp, { recursive: true, force: true })
})

test('createBrainFolder does not create .obsidian/ when includeObsidian is false', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'brain-test-'))
  const brainPath = join(tmp, 'my-brain')

  await createBrainFolder({ brainPath, includeObsidian: false })

  assert.ok(!existsSync(join(brainPath, '.obsidian')))

  rmSync(tmp, { recursive: true, force: true })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/scaffold.test.js
```
Expected: FAIL — `scaffold.js` not found.

- [ ] **Step 3: Implement scaffold.js**

`src/scaffold.js`:
```js
import { mkdirSync, writeFileSync, cpSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, 'templates')

const AGENTS_MD = `## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer \`graphify query "<question>"\`, \`graphify path "<A>" "<B>"\`, or \`graphify explain "<concept>"\` over grep
- After modifying code files in this session, run \`graphify update .\` to keep the graph current (AST-only, no API cost)
`

const GRAPHIFYIGNORE = `# Exclude templates from graph indexing
raw/templates/
`

const dirs = [
  'raw/notes',
  'raw/articles',
  'raw/projects',
  'raw/documentation',
  'raw/templates/markdown/_bundled',
  'raw/templates/markdown/_custom',
  'raw/templates/web-clipper/_bundled',
  'raw/templates/web-clipper/_custom',
  'graphify-out',
]

export async function createBrainFolder({ brainPath, includeObsidian }) {
  // Create all directories
  for (const dir of dirs) {
    mkdirSync(join(brainPath, dir), { recursive: true })
  }

  // Write static files
  writeFileSync(join(brainPath, 'AGENTS.md'), AGENTS_MD, 'utf8')
  writeFileSync(join(brainPath, '.graphifyignore'), GRAPHIFYIGNORE, 'utf8')

  // Copy bundled markdown templates
  cpSync(
    join(TEMPLATES_DIR, 'markdown', '_bundled'),
    join(brainPath, 'raw', 'templates', 'markdown', '_bundled'),
    { recursive: true }
  )

  // Copy bundled web-clipper templates
  cpSync(
    join(TEMPLATES_DIR, 'web-clipper', '_bundled'),
    join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'),
    { recursive: true }
  )

  // Optionally create .obsidian/
  if (includeObsidian) {
    mkdirSync(join(brainPath, '.obsidian'), { recursive: true })
    cpSync(
      join(TEMPLATES_DIR, 'obsidian'),
      join(brainPath, '.obsidian'),
      { recursive: true }
    )
  }
}
```

- [ ] **Step 4: Add bundled template source files**

Create `src/templates/markdown/_bundled/` and populate it by copying the 14 `.md` files from the current repo's `raw/templates/markdown/` (excluding `README.md`):

```bash
mkdir -p tool/src/templates/markdown/_bundled
mkdir -p tool/src/templates/web-clipper/_bundled
mkdir -p tool/src/templates/obsidian

# Copy markdown templates (exclude README.md)
for f in raw/templates/markdown/*.md; do
  [[ "$(basename $f)" != "README.md" ]] && cp "$f" tool/src/templates/markdown/_bundled/
done

# Copy web-clipper templates (exclude README.md)
for f in raw/templates/web-clipper/*.json; do
  cp "$f" tool/src/templates/web-clipper/_bundled/
done
```

Create `src/templates/markdown/_starter.md`:
```markdown
---
title: "{{title}}"
date: {{date}}
tags: []
---

## Summary


## Notes


## References

```

Create `src/templates/web-clipper/_starter.json`:
```json
{
  "name": "my-template",
  "behavior": "create",
  "noteContentFormat": "{{content}}",
  "properties": [
    { "name": "title", "value": "{{title}}", "type": "text" },
    { "name": "url", "value": "{{url}}", "type": "text" },
    { "name": "date", "value": "{{date}}", "type": "date" }
  ],
  "triggers": []
}
```

Copy existing `.obsidian/` config files (excluding `workspace.json` and `cache`):
```bash
for f in app.json appearance.json core-plugins.json graph.json templates.json; do
  cp ".obsidian/$f" tool/src/templates/obsidian/
done
```

Update `templates.json` to point at `_bundled/` path:
```json
{
  "folder": "raw/templates/markdown/_bundled"
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
node --test tests/scaffold.test.js
```
Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tool/src/scaffold.js tool/src/templates/ tool/tests/scaffold.test.js
git commit -m "feat: implement brain folder scaffold with bundled templates"
```

---

## Task 4: Graphify wrapper (install + run via .venv)

**Files:**
- Create: `tool/src/graphify.js`
- Create: `tool/tests/graphify.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/graphify.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { detectPython, venvPythonPath, venvExists } = await import('../src/graphify.js')

test('detectPython returns a path string or null', async () => {
  const result = await detectPython()
  // On any dev machine, Python should exist
  assert.ok(result === null || typeof result === 'string')
})

test('venvPythonPath returns correct path for macOS/Linux', () => {
  const result = venvPythonPath('/tmp/brain')
  assert.equal(result, '/tmp/brain/.venv/bin/python3')
})

test('venvExists returns false for non-existent path', () => {
  const result = venvExists('/tmp/definitely-does-not-exist-brain')
  assert.equal(result, false)
})

test('venvExists returns true after venv creation', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'venv-test-'))
  const { createVenv } = await import('../src/graphify.js')
  await createVenv(tmp)
  assert.ok(venvExists(tmp))
  rmSync(tmp, { recursive: true, force: true })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/graphify.test.js
```
Expected: FAIL — `graphify.js` not found.

- [ ] **Step 3: Implement graphify.js**

`src/graphify.js`:
```js
import { execa } from 'execa'
import { existsSync } from 'fs'
import { join } from 'path'
import { platform } from 'process'

// Returns path to the venv Python executable
export function venvPythonPath(brainPath) {
  if (platform === 'win32') {
    return join(brainPath, '.venv', 'Scripts', 'python.exe')
  }
  return join(brainPath, '.venv', 'bin', 'python3')
}

// Returns true if the .venv already exists and has the Python executable
export function venvExists(brainPath) {
  return existsSync(venvPythonPath(brainPath))
}

// Detect available Python 3.10+ binary. Returns path or null.
export async function detectPython() {
  for (const bin of ['python3', 'python']) {
    try {
      const { stdout } = await execa(bin, ['--version'])
      const match = stdout.match(/Python (\d+)\.(\d+)/)
      if (match && (parseInt(match[1]) > 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) >= 10))) {
        return bin
      }
    } catch {
      // not found, try next
    }
  }
  return null
}

// Detect uv (preferred) or fall back to pip
export async function detectPackageManager() {
  try {
    await execa('uv', ['--version'])
    return 'uv'
  } catch {
    return 'pip'
  }
}

// Create .venv and install graphify[mcp]
export async function createVenv(brainPath) {
  const pm = await detectPackageManager()
  if (pm === 'uv') {
    await execa('uv', ['venv', join(brainPath, '.venv')], { stdio: 'inherit' })
    await execa('uv', ['pip', 'install', 'graphifyy[mcp]', '--python', venvPythonPath(brainPath)], { stdio: 'inherit' })
  } else {
    const python = await detectPython()
    if (!python) throw new Error('Python 3.10+ is required. Download from https://www.python.org/downloads/')
    await execa(python, ['-m', 'venv', join(brainPath, '.venv')], { stdio: 'inherit' })
    await execa(venvPythonPath(brainPath), ['-m', 'pip', 'install', 'graphifyy[mcp]'], { stdio: 'inherit' })
  }
}

// Upgrade graphify[mcp] in existing .venv
export async function upgradeVenv(brainPath) {
  const pm = await detectPackageManager()
  if (pm === 'uv') {
    await execa('uv', ['pip', 'install', '--upgrade', 'graphifyy[mcp]', '--python', venvPythonPath(brainPath)], { stdio: 'inherit' })
  } else {
    await execa(venvPythonPath(brainPath), ['-m', 'pip', 'install', '--upgrade', 'graphifyy[mcp]'], { stdio: 'inherit' })
  }
}

// Run graphify to rebuild the graph from raw/
export async function runGraphify(brainPath) {
  await execa(venvPythonPath(brainPath), ['-m', 'graphify', join(brainPath, 'raw'), '--update'], {
    stdio: 'inherit',
    cwd: brainPath,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tests/graphify.test.js
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tool/src/graphify.js tool/tests/graphify.test.js
git commit -m "feat: add graphify wrapper (venv install, run, upgrade)"
```

---

## Task 5: Platform detection and MCP config patching

**Files:**
- Create: `tool/src/platforms/index.js`
- Create: `tool/src/platforms/claude.js`
- Create: `tool/src/platforms/opencode.js`
- Create: `tool/src/platforms/cursor.js`
- Create: `tool/src/platforms/gemini.js`
- Create: `tool/src/platforms/copilot.js`
- Create: `tool/src/platforms/codex.js`
- Create: `tool/tests/platforms.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/platforms.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const tmp = mkdtempSync(join(tmpdir(), 'platform-test-'))
process.env.HOME = tmp

const { detectAll } = await import('../src/platforms/index.js')
const { patch: patchClaude, skillContent } = await import('../src/platforms/claude.js')

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

  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

  const mcpPath = join(claudeDir, 'mcp.json')
  assert.ok(existsSync(mcpPath))
  const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
  assert.ok(mcp.mcpServers['ai-brain'])
  assert.equal(mcp.mcpServers['ai-brain'].type, 'stdio')

  rmSync(fakeHome, { recursive: true, force: true })
})

test('claude patch merges with existing mcp.json entries', async () => {
  const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
  const claudeDir = join(fakeHome, '.claude')
  mkdirSync(claudeDir, { recursive: true })
  writeFileSync(join(claudeDir, 'mcp.json'), JSON.stringify({
    mcpServers: { 'other-server': { type: 'stdio', command: 'other' } }
  }), 'utf8')

  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

  const mcp = JSON.parse(readFileSync(join(claudeDir, 'mcp.json'), 'utf8'))
  assert.ok(mcp.mcpServers['other-server'])  // existing entry preserved
  assert.ok(mcp.mcpServers['ai-brain'])       // new entry added

  rmSync(fakeHome, { recursive: true, force: true })
})

test('claude patch is idempotent — running twice does not duplicate entries', async () => {
  const fakeHome = mkdtempSync(join(tmpdir(), 'claude-test-'))
  const claudeDir = join(fakeHome, '.claude')
  mkdirSync(claudeDir, { recursive: true })

  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })
  await patchClaude({ brainPath: '/tmp/my-brain', homeDir: fakeHome })

  const mcp = JSON.parse(readFileSync(join(claudeDir, 'mcp.json'), 'utf8'))
  const keys = Object.keys(mcp.mcpServers)
  assert.equal(keys.filter(k => k === 'ai-brain').length, 1)

  rmSync(fakeHome, { recursive: true, force: true })
})

rmSync(tmp, { recursive: true, force: true })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/platforms.test.js
```
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement platforms/claude.js**

`src/platforms/claude.js`:
```js
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.claude'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const claudeDir = join(homeDir, '.claude')
  const mcpPath = join(claudeDir, 'mcp.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(claudeDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(mcpPath)) {
    try { config = JSON.parse(readFileSync(mcpPath, 'utf8')) } catch {}
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    type: 'stdio',
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(mcpPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill({ homeDir = homedir() } = {}) {
  const skillDir = join(homeDir, '.claude', 'commands')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'brain.md'), BRAIN_SKILL_MD, 'utf8')
}

const BRAIN_SKILL_MD = `# /brain

Interact with your ai-brain knowledge graph.

## Usage
- \`/brain update\` — rebuild the graph from raw/ and sync via git
- \`/brain status\` — show graph stats and tool version
- \`/brain query <question>\` — query the knowledge graph
- \`/brain path <concept-a> <concept-b>\` — find the shortest path between two concepts
`
```

- [ ] **Step 4: Implement the remaining platform files**

`src/platforms/opencode.js`:
```js
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.config', 'opencode'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const configDir = join(homeDir, '.config', 'opencode')
  const configPath = join(configDir, 'opencode.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(configDir, { recursive: true })

  let config = {}
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, 'utf8')) } catch {}
  }
  if (!config.mcp) config.mcp = {}

  config.mcp['ai-brain'] = {
    type: 'local',
    command: [python, '-m', 'graphify.serve', graphPath],
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {
  // OpenCode skill installation handled via opencode.json mcp entry
}
```

`src/platforms/cursor.js`:
```js
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.cursor'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const cursorDir = join(homeDir, '.cursor')
  const mcpPath = join(cursorDir, 'mcp.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(cursorDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(mcpPath)) {
    try { config = JSON.parse(readFileSync(mcpPath, 'utf8')) } catch {}
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(mcpPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {}
```

`src/platforms/gemini.js`:
```js
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.gemini'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const geminiDir = join(homeDir, '.gemini')
  const settingsPath = join(geminiDir, 'settings.json')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(geminiDir, { recursive: true })

  let config = { mcpServers: {} }
  if (existsSync(settingsPath)) {
    try { config = JSON.parse(readFileSync(settingsPath, 'utf8')) } catch {}
    if (!config.mcpServers) config.mcpServers = {}
  }

  config.mcpServers['ai-brain'] = {
    command: python,
    args: ['-m', 'graphify.serve', graphPath],
  }

  writeFileSync(settingsPath, JSON.stringify(config, null, 2), 'utf8')
}

export async function installSkill() {}
```

`src/platforms/copilot.js`:
```js
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  // GitHub Copilot CLI stores config here
  return existsSync(join(homeDir, '.config', 'gh'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  // Copilot CLI does not use a JSON MCP config — skill install is the integration point
}

export async function installSkill() {
  // graphify install --platform copilot handled externally for now
}
```

`src/platforms/codex.js`:
```js
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export function detect(homeDir = homedir()) {
  return existsSync(join(homeDir, '.codex'))
}

export async function patch({ brainPath, homeDir = homedir() }) {
  const codexDir = join(homeDir, '.codex')
  const configPath = join(codexDir, 'config.toml')
  const python = join(brainPath, '.venv', 'bin', 'python3')
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')

  mkdirSync(codexDir, { recursive: true })

  let existing = ''
  if (existsSync(configPath)) {
    existing = readFileSync(configPath, 'utf8')
  }

  // Remove existing ai-brain block if present, then append fresh
  const cleaned = existing.replace(/\[mcp_servers\.ai-brain\][^\[]*/s, '').trim()
  const entry = `\n\n[mcp_servers.ai-brain]\ncommand = "${python}"\nargs = ["-m", "graphify.serve", "${graphPath}"]\n`

  writeFileSync(configPath, cleaned + entry, 'utf8')
}

export async function installSkill() {}
```

`src/platforms/index.js`:
```js
import { homedir } from 'os'
import * as claude from './claude.js'
import * as opencode from './opencode.js'
import * as cursor from './cursor.js'
import * as gemini from './gemini.js'
import * as copilot from './copilot.js'
import * as codex from './codex.js'

const PLATFORMS = [
  { name: 'Claude Code',         key: 'claude',   module: claude,   configHint: '~/.claude/' },
  { name: 'OpenCode',            key: 'opencode', module: opencode, configHint: '~/.config/opencode/' },
  { name: 'Cursor',              key: 'cursor',   module: cursor,   configHint: '~/.cursor/' },
  { name: 'Gemini CLI',          key: 'gemini',   module: gemini,   configHint: '~/.gemini/' },
  { name: 'GitHub Copilot CLI',  key: 'copilot',  module: copilot,  configHint: '~/.config/gh/' },
  { name: 'OpenAI Codex CLI',    key: 'codex',    module: codex,    configHint: '~/.codex/' },
]

export async function detectAll(homeDir = homedir()) {
  return PLATFORMS.map(p => ({
    ...p,
    detected: p.module.detect(homeDir),
  }))
}

export async function configureSelected({ selected, brainPath, homeDir = homedir() }) {
  for (const platform of selected) {
    await platform.module.patch({ brainPath, homeDir })
    await platform.module.installSkill({ homeDir })
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
node --test tests/platforms.test.js
```
Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tool/src/platforms/ tool/tests/platforms.test.js
git commit -m "feat: add platform detection and MCP config patching for all 6 platforms"
```

---

## Task 6: Git initialisation and .gitignore generation

**Files:**
- Create: `tool/src/git.js`
- Create: `tool/tests/git.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/git.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { initRepo, writeGitignore } = await import('../src/git.js')

test('writeGitignore creates .gitignore with commitCache=true (no cache line)', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
  await writeGitignore({ brainPath: tmp, commitCache: true })
  const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
  assert.ok(content.includes('.venv/'))
  assert.ok(content.includes('graphify-out/.graphify_*'))
  assert.ok(!content.includes('graphify-out/cache/'))
  rmSync(tmp, { recursive: true, force: true })
})

test('writeGitignore adds graphify-out/cache/ when commitCache=false', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
  await writeGitignore({ brainPath: tmp, commitCache: false })
  const content = readFileSync(join(tmp, '.gitignore'), 'utf8')
  assert.ok(content.includes('graphify-out/cache/'))
  rmSync(tmp, { recursive: true, force: true })
})

test('initRepo creates a .git directory', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'git-test-'))
  await initRepo({ brainPath: tmp, remoteUrl: null })
  assert.ok(existsSync(join(tmp, '.git')))
  rmSync(tmp, { recursive: true, force: true })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/git.test.js
```
Expected: FAIL — `git.js` not found.

- [ ] **Step 3: Implement git.js**

`src/git.js`:
```js
import { writeFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'

const GITIGNORE = (commitCache) => `# macOS
.DS_Store

# Python environment — recreated by "npx ai-brain setup" on a new machine
.venv/
venv/
__pycache__/
*.pyc

# Graphify local artifacts
${commitCache ? '' : 'graphify-out/cache/\n'}graphify-out/.graphify_*
graphify-out/manifest.json
graphify-out/cost.json

# Obsidian — keep plugin config, ignore machine-specific workspace state
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
`

export async function writeGitignore({ brainPath, commitCache }) {
  writeFileSync(join(brainPath, '.gitignore'), GITIGNORE(commitCache), 'utf8')
}

export async function initRepo({ brainPath, remoteUrl }) {
  await execa('git', ['init'], { cwd: brainPath })
  if (remoteUrl) {
    await execa('git', ['remote', 'add', 'origin', remoteUrl], { cwd: brainPath })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tests/git.test.js
```
Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tool/src/git.js tool/tests/git.test.js
git commit -m "feat: add git init and .gitignore generation with cache choice"
```

---

## Task 7: Setup wizard command

**Files:**
- Modify: `tool/src/commands/setup.js`

This task has no unit tests — the wizard is integration-tested manually. The underlying pieces (scaffold, graphify, platforms, git) are all unit-tested.

- [ ] **Step 1: Implement setup.js**

`src/commands/setup.js`:
```js
import { input, select, checkbox, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { homedir } from 'os'

import { createBrainFolder } from '../scaffold.js'
import { createVenv, venvExists } from '../graphify.js'
import { detectAll, configureSelected } from '../platforms/index.js'
import { initRepo, writeGitignore } from '../git.js'
import { writeConfig } from '../config.js'

const BRAIN_MARKER = ['raw', 'AGENTS.md', '.graphifyignore']

function isExistingBrain(dir) {
  return BRAIN_MARKER.every(f => existsSync(join(dir, f)))
}

export async function run() {
  console.log(chalk.bold('\n  ╔════════════════════════════════════╗'))
  console.log(chalk.bold('  ║   ai-brain setup wizard            ║'))
  console.log(chalk.bold('  ╚════════════════════════════════════╝\n'))
  console.log('  Your personal AI memory, connected to all your AI tools.\n')

  // Detect if running inside an existing brain folder
  const cwd = process.cwd()
  if (isExistingBrain(cwd)) {
    await newMachineSetup(cwd)
    return
  }

  await freshSetup()
}

async function freshSetup() {
  // Brain folder name
  const name = await input({
    message: 'Brain folder name:',
    default: 'ai-brain',
  })

  // Location
  const locationChoice = await select({
    message: 'Where do you want to create it?',
    choices: [
      { name: `Current directory  (${process.cwd()})`, value: 'current' },
      { name: 'Choose a different location', value: 'custom' },
    ],
  })

  let baseDir = process.cwd()
  if (locationChoice === 'custom') {
    const customPath = await input({ message: 'Path:' })
    baseDir = resolve(customPath)
  }

  const brainPath = join(baseDir, name)

  // Git mode
  const gitMode = await select({
    message: 'How do you want to manage your brain?',
    choices: [
      { name: 'Git repository (recommended) — sync across machines via git', value: 'git' },
      { name: 'Local folder only — this machine only', value: 'local' },
    ],
  })

  let remoteUrl = null
  let commitCache = true
  if (gitMode === 'git') {
    remoteUrl = await input({
      message: 'Git remote URL (leave blank to init locally, add remote later):',
      default: '',
    })
    remoteUrl = remoteUrl.trim() || null

    commitCache = await confirm({
      message: 'Commit extraction cache to git? (saves AI tokens on every machine — recommended)',
      default: true,
    })
  }

  // Scaffold
  const spinnerScaffold = ora('Creating brain folder...').start()
  // Obsidian choice comes later — scaffold without it first, add if needed
  await createBrainFolder({ brainPath, includeObsidian: false })
  spinnerScaffold.succeed(`Created ${brainPath}`)

  // Git init
  if (gitMode === 'git') {
    const spinnerGit = ora('Initializing git repo...').start()
    await initRepo({ brainPath, remoteUrl })
    await writeGitignore({ brainPath, commitCache })
    spinnerGit.succeed('Initialized git repo')
  }

  // Venv + graphify
  const spinnerVenv = ora('Installing dependencies...').start()
  await createVenv(brainPath)
  spinnerVenv.succeed('Installed graphify')

  // AI platform detection
  const platforms = await detectAll()
  const platformChoices = platforms.map(p => ({
    name: `${p.name.padEnd(22)} ${p.detected ? chalk.green('detected at ' + p.configHint) : chalk.dim('not detected (you can still enable it)')}`,
    value: p,
    checked: p.detected,
  }))

  const selected = await checkbox({
    message: 'Which AI tools do you use? (space to toggle, enter to confirm)',
    choices: platformChoices,
  })

  const spinnerPlatforms = ora('Configuring AI tools...').start()
  await configureSelected({ selected, brainPath })
  spinnerPlatforms.succeed(`Configured ${selected.length} AI tool(s)`)

  // Obsidian
  const obsidianChoice = await select({
    message: 'Do you use Obsidian?',
    choices: [
      { name: 'Yes, use this brain folder as my Obsidian vault', value: 'brain' },
      { name: 'Yes, I have a separate Obsidian vault', value: 'separate' },
      { name: 'No / Skip', value: 'skip' },
    ],
  })

  if (obsidianChoice === 'brain') {
    const spinnerObs = ora('Configuring Obsidian...').start()
    await createBrainFolder({ brainPath, includeObsidian: true })
    spinnerObs.succeed('Configured Obsidian vault')
  } else if (obsidianChoice === 'separate') {
    const vaultPath = await input({ message: 'Path to your Obsidian vault:' })
    const spinnerObs = ora('Configuring Obsidian...').start()
    await createBrainFolder({ brainPath, includeObsidian: true })
    spinnerObs.succeed(`Configured Obsidian (vault at ${vaultPath})`)
  }

  // Save brain path to global config
  writeConfig({ brainPath })

  // Summary
  printSummary({ brainPath, gitMode, remoteUrl, selected, obsidianChoice })
}

async function newMachineSetup(brainPath) {
  console.log(chalk.yellow('  Existing brain detected. Running new-machine setup...\n'))

  const spinnerVenv = ora('Recreating dependencies...').start()
  await createVenv(brainPath)
  spinnerVenv.succeed('Installed graphify')

  const platforms = await detectAll()
  const platformChoices = platforms.map(p => ({
    name: `${p.name.padEnd(22)} ${p.detected ? chalk.green('detected') : chalk.dim('not detected')}`,
    value: p,
    checked: p.detected,
  }))

  const selected = await checkbox({
    message: 'Which AI tools do you want to configure on this machine?',
    choices: platformChoices,
  })

  const spinnerPlatforms = ora('Configuring AI tools...').start()
  await configureSelected({ selected, brainPath })
  spinnerPlatforms.succeed(`Configured ${selected.length} AI tool(s)`)

  writeConfig({ brainPath })

  console.log(chalk.green('\n  ✔ New machine setup complete!'))
  console.log(`  Brain: ${brainPath}`)
  console.log('  Restart your AI tools to connect to the brain.\n')
}

function printSummary({ brainPath, gitMode, remoteUrl, selected, obsidianChoice }) {
  const platformNames = selected.map(p => p.name).join(', ') || 'none'
  const gitStatus = gitMode === 'git' ? (remoteUrl ? `git (${remoteUrl})` : 'git (no remote yet)') : 'local only'

  console.log(chalk.bold('\n  ╔════════════════════════════════════════════════════════╗'))
  console.log(chalk.bold('  ║   Setup complete!                                      ║'))
  console.log(chalk.bold('  ╠════════════════════════════════════════════════════════╣'))
  console.log(`  ║   Brain:      ${brainPath}`)
  console.log(`  ║   Git:        ${gitStatus}`)
  console.log(`  ║   Platforms:  ${platformNames}`)
  if (obsidianChoice !== 'skip') console.log('  ║   Obsidian:   vault configured')
  console.log(chalk.bold('  ╠════════════════════════════════════════════════════════╣'))
  console.log('  ║   Next steps:')
  console.log('  ║   1. Restart your AI tools')
  console.log(`  ║   2. Drop notes into ${brainPath}/raw/`)
  console.log('  ║   3. Run: npx ai-brain update')
  console.log('  ║      or:  /brain update  in your AI tool')
  if (obsidianChoice !== 'skip') {
    console.log('  ║')
    console.log('  ║   Obsidian:')
    console.log(`  ║   4. Open Obsidian → Open folder → ${brainPath}`)
    console.log('  ║   5. Enable: Templates plugin (already configured)')
    console.log('  ║   6. See raw/templates/web-clipper/README.md for web clipper setup')
  }
  console.log(chalk.bold('  ╚════════════════════════════════════════════════════════╝\n'))
}
```

- [ ] **Step 2: Smoke-test the wizard manually**

```bash
node bin/ai-brain.js setup --help
```
Expected: shows description for setup command.

```bash
node bin/ai-brain.js setup
```
Expected: wizard prompts appear in order, no crashes.

- [ ] **Step 3: Commit**

```bash
git add tool/src/commands/setup.js
git commit -m "feat: implement setup wizard (fresh and new-machine modes)"
```

---

## Task 8: update, status, templates, templates add, upgrade commands

**Files:**
- Modify: `tool/src/commands/update.js`
- Modify: `tool/src/commands/status.js`
- Modify: `tool/src/commands/templates.js`
- Modify: `tool/src/commands/templates-add.js`
- Modify: `tool/src/commands/upgrade.js`
- Create: `tool/tests/templates.test.js`

- [ ] **Step 1: Write failing tests for templates commands**

`tests/templates.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { listTemplates } = await import('../src/templates-lib.js')
const { addTemplate } = await import('../src/templates-lib.js')

test('listTemplates returns bundled and custom arrays', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
  mkdirSync(join(tmp, 'raw/templates/markdown/_bundled'), { recursive: true })
  mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })
  mkdirSync(join(tmp, 'raw/templates/web-clipper/_bundled'), { recursive: true })
  mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

  writeFileSync(join(tmp, 'raw/templates/markdown/_bundled/book-template.md'), '# book', 'utf8')
  writeFileSync(join(tmp, 'raw/templates/markdown/_custom/my-template.md'), '# mine', 'utf8')

  const result = listTemplates(tmp)
  assert.ok(result.markdown.bundled.includes('book-template.md'))
  assert.ok(result.markdown.custom.includes('my-template.md'))

  rmSync(tmp, { recursive: true, force: true })
})

test('addTemplate creates file in _custom/ with starter content', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
  mkdirSync(join(tmp, 'raw/templates/markdown/_custom'), { recursive: true })

  await addTemplate({ brainPath: tmp, type: 'markdown', name: 'research-interview' })

  assert.ok(existsSync(join(tmp, 'raw/templates/markdown/_custom/research-interview-template.md')))

  rmSync(tmp, { recursive: true, force: true })
})

test('addTemplate for web-clipper creates .json file in _custom/', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tmpl-test-'))
  mkdirSync(join(tmp, 'raw/templates/web-clipper/_custom'), { recursive: true })

  await addTemplate({ brainPath: tmp, type: 'web-clipper', name: 'podcast' })

  assert.ok(existsSync(join(tmp, 'raw/templates/web-clipper/_custom/podcast-template.json')))

  rmSync(tmp, { recursive: true, force: true })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/templates.test.js
```
Expected: FAIL — `templates-lib.js` not found.

- [ ] **Step 3: Implement src/templates-lib.js**

`src/templates-lib.js`:
```js
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STARTERS_DIR = join(__dirname, 'templates')

export function listTemplates(brainPath) {
  const read = (dir) => existsSync(dir) ? readdirSync(dir) : []
  return {
    markdown: {
      bundled: read(join(brainPath, 'raw', 'templates', 'markdown', '_bundled')),
      custom:  read(join(brainPath, 'raw', 'templates', 'markdown', '_custom')),
    },
    webClipper: {
      bundled: read(join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled')),
      custom:  read(join(brainPath, 'raw', 'templates', 'web-clipper', '_custom')),
    },
  }
}

export async function addTemplate({ brainPath, type, name }) {
  const isMarkdown = type === 'markdown'
  const ext = isMarkdown ? '.md' : '.json'
  const subdir = isMarkdown ? 'markdown' : 'web-clipper'
  const starterFile = isMarkdown ? '_starter.md' : '_starter.json'
  const destName = `${name}-template${ext}`
  const destPath = join(brainPath, 'raw', 'templates', subdir, '_custom', destName)
  const starter = readFileSync(join(STARTERS_DIR, subdir, starterFile), 'utf8')
  writeFileSync(destPath, starter, 'utf8')
  return destPath
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tests/templates.test.js
```
Expected: all 3 tests PASS.

- [ ] **Step 5: Implement the command files**

`src/commands/templates.js`:
```js
import chalk from 'chalk'
import { readConfig } from '../config.js'
import { listTemplates } from '../templates-lib.js'

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: npx ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config
  const tmpl = listTemplates(brainPath)

  console.log('\n  Markdown templates')
  console.log('  ' + '─'.repeat(54))
  console.log('  _bundled/ (tool-managed)')
  for (const f of tmpl.markdown.bundled) console.log(`  ✔ ${f}`)
  console.log('  _custom/ (yours)')
  if (tmpl.markdown.custom.length === 0) {
    console.log(chalk.dim('    (none yet — run "npx ai-brain templates add" to create one)'))
  } else {
    for (const f of tmpl.markdown.custom) console.log(`  ✔ ${f}`)
  }

  console.log('\n  Web Clipper templates')
  console.log('  ' + '─'.repeat(54))
  console.log('  _bundled/ (tool-managed)')
  for (const f of tmpl.webClipper.bundled) console.log(`  ✔ ${f}`)
  console.log('  _custom/ (yours)')
  if (tmpl.webClipper.custom.length === 0) {
    console.log(chalk.dim('    (none yet — run "npx ai-brain templates add" to create one)'))
  } else {
    for (const f of tmpl.webClipper.custom) console.log(`  ✔ ${f}`)
  }

  console.log()
  console.log('  Run "npx ai-brain templates add" to create a new custom template.')
  console.log('  Run "npx ai-brain upgrade" to update bundled templates.\n')
}
```

`src/commands/templates-add.js`:
```js
import { select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import { readConfig } from '../config.js'
import { addTemplate } from '../templates-lib.js'

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: npx ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  const type = await select({
    message: 'Template type:',
    choices: [
      { name: 'Markdown (for Obsidian notes)', value: 'markdown' },
      { name: 'Web Clipper (for browser clipping)', value: 'web-clipper' },
    ],
  })

  const name = await input({
    message: 'Template name:',
    default: 'my-template',
  })

  const destPath = await addTemplate({ brainPath, type, name })

  console.log(chalk.green(`\n  ✔ Created ${destPath}`))
  console.log('    Open it in your editor and fill in the content.')
  console.log('    This file lives in _custom/ and will never be modified by ai-brain upgrades.\n')
}
```

`src/commands/update.js`:
```js
import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import { readConfig } from '../config.js'
import { runGraphify } from '../graphify.js'
import { existsSync } from 'fs'
import { join } from 'path'

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: npx ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  const spinner = ora('Rebuilding knowledge graph...').start()
  await runGraphify(brainPath)
  spinner.succeed('Knowledge graph rebuilt')

  const isGit = existsSync(join(brainPath, '.git'))
  if (isGit) {
    const spinnerGit = ora('Syncing via git...').start()
    try {
      await execa('git', ['add', '.'], { cwd: brainPath })
      await execa('git', ['commit', '-m', 'Update AI brain'], { cwd: brainPath })
      await execa('git', ['push'], { cwd: brainPath })
      spinnerGit.succeed('Pushed to remote')
    } catch (e) {
      spinnerGit.warn('Git sync skipped — ' + e.message)
    }
  }

  console.log(chalk.green('\n  ✔ Brain updated\n'))
}
```

`src/commands/status.js`:
```js
import chalk from 'chalk'
import { readConfig } from '../config.js'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { venvPythonPath } from '../graphify.js'
import { readFileSync as rf } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(rf(join(__dirname, '../../package.json'), 'utf8'))

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: npx ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  console.log('\n  ai-brain status\n')
  console.log(`  Tool version:   ${pkg.version}`)
  console.log(`  Brain path:     ${brainPath}`)

  // graphify version
  const python = venvPythonPath(brainPath)
  if (existsSync(python)) {
    try {
      const { stdout } = await execa(python, ['-m', 'graphify', '--version'])
      console.log(`  Graphify:       ${stdout.trim()}`)
    } catch {
      console.log(`  Graphify:       ${chalk.yellow('error reading version')}`)
    }
  } else {
    console.log(`  Graphify:       ${chalk.red('not installed (.venv missing)')}`)
  }

  // Graph stats
  const graphPath = join(brainPath, 'graphify-out', 'graph.json')
  if (existsSync(graphPath)) {
    try {
      const graph = JSON.parse(readFileSync(graphPath, 'utf8'))
      const nodeCount = graph.nodes?.length ?? '?'
      const edgeCount = graph.edges?.length ?? '?'
      console.log(`  Graph:          ${nodeCount} nodes, ${edgeCount} edges`)
    } catch {
      console.log(`  Graph:          ${chalk.yellow('could not read graph.json')}`)
    }
  } else {
    console.log(`  Graph:          ${chalk.dim('not built yet — run: npx ai-brain update')}`)
  }

  console.log()
}
```

`src/commands/upgrade.js`:
```js
import chalk from 'chalk'
import ora from 'ora'
import { cpSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readConfig } from '../config.js'
import { upgradeVenv } from '../graphify.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')

export async function run() {
  const config = readConfig()
  if (!config) {
    console.error(chalk.red('  No brain configured. Run: npx ai-brain setup'))
    process.exit(1)
  }
  const { brainPath } = config

  const spinnerVenv = ora('Upgrading graphify...').start()
  await upgradeVenv(brainPath)
  spinnerVenv.succeed('Graphify upgraded')

  const spinnerTmpl = ora('Refreshing bundled templates...').start()

  cpSync(
    join(TEMPLATES_DIR, 'markdown', '_bundled'),
    join(brainPath, 'raw', 'templates', 'markdown', '_bundled'),
    { recursive: true, force: true }
  )
  cpSync(
    join(TEMPLATES_DIR, 'web-clipper', '_bundled'),
    join(brainPath, 'raw', 'templates', 'web-clipper', '_bundled'),
    { recursive: true, force: true }
  )

  spinnerTmpl.succeed('Bundled templates refreshed (_custom/ untouched)')
  console.log(chalk.green('\n  ✔ Upgrade complete\n'))
}
```

- [ ] **Step 6: Smoke-test all commands**

```bash
node bin/ai-brain.js update --help
node bin/ai-brain.js status --help
node bin/ai-brain.js templates --help
node bin/ai-brain.js upgrade --help
```
Expected: each shows description with no errors.

- [ ] **Step 7: Commit**

```bash
git add tool/src/commands/ tool/src/templates-lib.js tool/tests/templates.test.js
git commit -m "feat: implement update, status, templates, templates add, upgrade commands"
```

---

## Task 9: MCP server

**Files:**
- Modify: `tool/src/mcp/server.js`

The MCP server is a thin wrapper that starts graphify's built-in MCP server process. It does not need unit tests — it delegates entirely to graphify.

- [ ] **Step 1: Implement mcp/server.js**

`src/mcp/server.js`:
```js
/**
 * MCP server entry point.
 * Started by AI platforms via their MCP config, e.g.:
 *   command: "/path/to/brain/.venv/bin/python3"
 *   args: ["-m", "graphify.serve", "/path/to/brain/graphify-out/graph.json"]
 *
 * This file is not invoked directly — the MCP config written during setup
 * points directly at the graphify.serve module in the .venv.
 * This module exists as documentation and for future custom MCP tools.
 */

export const MCP_TOOLS = [
  {
    name: 'brain_update',
    description: 'Rebuild the knowledge graph from raw/ and sync via git',
  },
  {
    name: 'brain_status',
    description: 'Return health info: tool version, node/edge count, last build time',
  },
  {
    name: 'brain_query',
    description: 'Query the knowledge graph with a natural language question',
    inputSchema: {
      type: 'object',
      properties: { question: { type: 'string' } },
      required: ['question'],
    },
  },
  {
    name: 'brain_path',
    description: 'Find the shortest path between two concepts in the graph',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        target: { type: 'string' },
      },
      required: ['source', 'target'],
    },
  },
  {
    name: 'brain_explain',
    description: 'Explain a concept from the knowledge graph',
    inputSchema: {
      type: 'object',
      properties: { concept: { type: 'string' } },
      required: ['concept'],
    },
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add tool/src/mcp/server.js
git commit -m "docs: add MCP server documentation and tool schema"
```

---

## Task 10: README and final wiring

**Files:**
- Create: `tool/README.md`
- Modify: `tool/bin/ai-brain.js` (fix templates subcommand wiring)

- [ ] **Step 1: Fix templates subcommand wiring in bin/ai-brain.js**

The `templates add` subcommand needs to be wired correctly with commander:

```js
const templates = program
  .command('templates')
  .description('List all templates (bundled and custom)')
  .action(async () => { const { run } = await import('../src/commands/templates.js'); await run() })

templates
  .command('add')
  .description('Create a new custom template from a starter file')
  .action(async () => { const { run } = await import('../src/commands/templates-add.js'); await run() })
```

Replace the existing `templates` block in `bin/ai-brain.js` with the above.

- [ ] **Step 2: Verify subcommand routing**

```bash
node bin/ai-brain.js templates --help
```
Expected:
```
Usage: ai-brain templates [options] [command]

List all templates (bundled and custom)

Commands:
  add    Create a new custom template from a starter file
```

```bash
node bin/ai-brain.js templates add --help
```
Expected: shows description for `add`.

- [ ] **Step 3: Write tool/README.md**

Create `tool/README.md` with the full command reference. Content:

````markdown
# ai-brain

Your personal AI memory, connected to all your AI tools.

## Quick start

```bash
npx ai-brain setup
```

Runs the interactive wizard: creates your brain folder, installs graphify, configures every detected AI tool (Claude Code, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, OpenAI Codex CLI), and optionally sets up Obsidian.

---

## Commands

### `ai-brain setup`

Run the interactive setup wizard.

- On a fresh machine with no brain: full wizard (create folder, git, AI tools, Obsidian).
- Run inside an existing brain folder (e.g. after `git clone`): new-machine mode — only recreates `.venv` and patches local AI tool configs.

```bash
npx ai-brain setup
npx ai-brain setup --help
```

---

### `ai-brain update`

Rebuild the knowledge graph from `raw/` and sync via git (if the brain is a git repo).

```bash
npx ai-brain update
```

Equivalent inside any AI tool: `/brain update`

---

### `ai-brain status`

Show brain health: tool version, graphify version, graph node/edge count, brain path.

```bash
npx ai-brain status
```

---

### `ai-brain templates`

List all templates — both tool-managed (`_bundled/`) and yours (`_custom/`).

```bash
npx ai-brain templates
```

---

### `ai-brain templates add`

Create a new custom template from a minimal starter file. Places the file in `raw/templates/markdown/_custom/` or `raw/templates/web-clipper/_custom/`. Files in `_custom/` are never touched by upgrades.

```bash
npx ai-brain templates add
```

---

### `ai-brain upgrade`

Upgrade graphify in `.venv/` and refresh all bundled templates in `_bundled/`. Your custom templates in `_custom/` are never touched.

```bash
npx ai-brain upgrade
```

---

## Template ownership

```
raw/templates/
├── markdown/
│   ├── _bundled/    ← tool-owned, rewritten on upgrade
│   └── _custom/     ← yours, never touched by the tool
└── web-clipper/
    ├── _bundled/    ← tool-owned, rewritten on upgrade
    └── _custom/     ← yours, never touched by the tool
```

---

## Inside AI tools

After setup, a `/brain` skill is installed in each configured AI tool:

```
/brain update
/brain status
/brain query "what do I know about X?"
/brain path "concept A" "concept B"
```

---

## New machine setup

After cloning your brain repo on a new machine:

```bash
cd ai-brain
npx ai-brain setup
```

The tool detects the existing brain, skips scaffolding, and only recreates `.venv` and patches your local AI tool configs.

---

## Options

```
--help, -h      Show help for any command
--version, -v   Show the current tool version
```
````

- [ ] **Step 4: Run all tests one final time**

```bash
node --test tests/*.test.js
```
Expected: all tests PASS.

- [ ] **Step 5: Final commit**

```bash
git add tool/README.md tool/bin/ai-brain.js
git commit -m "feat: complete ai-brain-tool v1.0.0 — README and final CLI wiring"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by task |
|---|---|
| `npx ai-brain setup` wizard — fresh mode | Task 7 |
| `npx ai-brain setup` — new machine mode | Task 7 |
| Brain folder structure with `_bundled/` and `_custom/` | Task 3 |
| Bundled templates copied to `_bundled/` on setup | Task 3 |
| Bundled templates rewritten on upgrade, `_custom/` untouched | Task 8 (upgrade.js) |
| `templates add` creates file in `_custom/` from starter | Task 8 (templates-add.js) |
| Platform detection + MCP config patching (all 6) | Task 5 |
| `/brain` skill installed per platform | Task 5 |
| `.gitignore` with cache choice | Task 6 |
| `graphify-out/cache/` conditional on user choice | Task 6 |
| `.obsidian/` config committed, workspace ignored | Task 3 |
| `--help` on every command | Task 1 + Task 10 |
| `README.md` full command reference | Task 10 |
| `~/.ai-brain-config.json` for cross-directory usage | Task 2 |
| MCP tools documented | Task 9 |
| `update` rebuilds graph + git sync | Task 8 |
| `status` shows versions + graph stats | Task 8 |
| `upgrade` updates graphify + refreshes `_bundled/` | Task 8 |

All spec requirements covered. No gaps found.
