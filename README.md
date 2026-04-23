<p align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/jorge-moreira/ai-brain-tool/main/docs/logo.svg" alt="ai-brain-tool"/></a>
  
  <strong>Your personal AI memory, connected to all your AI tools</strong>




[![CI](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40jorge-moreiva.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreiva.dev/ai-brain-tool)
[![npm downloads](https://img.shields.io/npm/dm/%40jorge-moreiva.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreiva.dev/ai-brain-tool)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/jorge-moreira)


*Powered by* **[graphify](https://github.com/safishamsi/graphify)**

<a href="https://graphifylabs.ai"><img src="https://raw.githubusercontent.com/safishamsi/graphify/v4/docs/logo-text.svg" width="260" height="64" alt="Graphify"/></a>

> The knowledge graph engine that turns folders of notes,  code, papers, and media into a queryable graph your AI tools can traverse.

[Quick Start](#quick-start) · [Commands](#commands) · [Template Ownership](#template-ownership) · [Inside AI Tools](#inside-ai-tools) · [New Machine Setup](#new-machine-setup) · [Options](#options) · [Credits](#credits)

</p>

---

## Quick start

```bash
npx @jorge-moreiva.dev/ai-brain-tool setup
```

Runs the interactive wizard: creates your brain folder, installs graphify, configures every detected AI tool (Claude Code, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, OpenAI Codex CLI), and optionally sets up Obsidian.

---

## Commands

### `ai-brain setup`

Run the interactive setup wizard.

- **Fresh machine:** full wizard — creates the brain folder, initialises git, installs graphify, configures AI tools, sets up Obsidian.
- **Inside an existing brain folder** (e.g. after `git clone`): new-machine mode — only recreates `.venv` and patches local AI tool configs.

What the wizard configures per selected AI tool:
- MCP server entry pointing to the brain's `graph.json`
- `/brain` skill installed globally in the tool
- Always-on context file written into the brain folder (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules/ai-brain.mdc`, or `.github/copilot-instructions.md`)

Git options asked during setup:
- Git repository or local folder only
- Optional remote URL
- Whether to commit the extraction cache (saves tokens on new machines)
- **Auto-sync** — whether `/brain update` should commit and push automatically after each graph rebuild

```bash
npx @jorge-moreiva.dev/ai-brain-tool setup
```

---

### `ai-brain update`

Rebuild the knowledge graph from `raw/` using graphify. If auto-sync was enabled during setup (`.brain-config.json: { "gitSync": true }`), commits and pushes after the rebuild with a meaningful message based on what changed.

```bash
npx @jorge-moreiva.dev/ai-brain-tool update
```

Equivalent inside any AI tool: `/brain update`

---

### `ai-brain status`

Show brain health: tool version, graphify version, graph node/edge count, brain path.

```bash
npx @jorge-moreiva.dev/ai-brain-tool status
```

---

### `ai-brain templates`

List all templates — both tool-managed (`_bundled/`) and yours (`_custom/`).

```bash
npx @jorge-moreiva.dev/ai-brain-tool templates
```

---

### `ai-brain templates add`

Create a new custom template from a minimal starter file. Places the file in `raw/templates/markdown/_custom/` or `raw/templates/web-clipper/_custom/`. Files in `_custom/` are never touched by upgrades.

```bash
npx @jorge-moreiva.dev/ai-brain-tool templates add
```

---

### `ai-brain upgrade`

Upgrade graphify in `.venv/` and refresh all bundled templates in `_bundled/`. Your custom templates in `_custom/` are never touched.

```bash
npx @jorge-moreiva.dev/ai-brain-tool upgrade
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

After setup, a `/brain` skill is installed in each configured AI tool. Commands run from inside the brain folder manage the brain; query commands work from any project.

```
/brain update              — rebuild graph from raw/ (+ auto-sync if enabled)
/brain add <url>           — fetch a URL and add it to raw/
/brain templates           — list available templates
/brain wiki                — generate agent-crawlable wiki (graphify-out/wiki/)
/brain obsidian            — generate Obsidian vault export
/brain query "<question>"  — query the knowledge graph via MCP
/brain path "<A>" "<B>"    — find shortest path between two concepts via MCP
/brain status              — show graph stats and tool version
```

---

## New machine setup

After cloning your brain repo on a new machine:

```bash
cd your-brain
npx @jorge-moreiva.dev/ai-brain-tool setup
```

The tool detects the existing brain, skips scaffolding, and only recreates `.venv` and patches your local AI tool configs.

---

## Options

```
--help, -h      Show help for any command
--version, -v   Show the current tool version
```

---

## Credits

ai-brain is a facade over **[graphify](https://github.com/safishamsi/graphify)** by [@safishamsi](https://github.com/safishamsi). All graph extraction, clustering, wiki generation, Obsidian export, and MCP serving is done by graphify. This tool adds the setup wizard, platform integrations, and `/brain` skill layer on top.
