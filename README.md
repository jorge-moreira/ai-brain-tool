# ai-brain

[![CI](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40jorge-moreiva.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreiva.dev/ai-brain-tool)
[![npm downloads](https://img.shields.io/npm/dm/%40jorge-moreiva.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreiva.dev/ai-brain-tool)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/jorge-moreira)

> Powered by [graphify](https://github.com/safishamsi/graphify) — the knowledge graph engine that indexes your notes and exposes them to AI tools via MCP. Visit [graphifylabs.ai](https://graphifylabs.ai/) to learn more.

Your personal AI memory, connected to all your AI tools.

## Quick start

```bash
npx @jorge-moreiva.dev/ai-brain-tool setup
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
