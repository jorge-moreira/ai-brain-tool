<div align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/jorge-moreira/ai-brain-tool/main/docs/logo.svg" height="150" alt="ai-brain-tool"/></a>
  
  <h3>Your personal AI memory, connected to all your AI tools</h3>
  <br>

[![Test](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/test.yml/badge.svg)](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/jorge-moreira/ai-brain-tool/graph/badge.svg)](https://codecov.io/gh/jorge-moreira/ai-brain-tool)
[![npm version](https://img.shields.io/npm/v/%40jorge-moreira.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreira.dev/ai-brain-tool)
[![npm downloads](https://img.shields.io/npm/dm/%40jorge-moreira.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreira.dev/ai-brain-tool)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/jorge-moreira)


*Powered by* **[graphify](https://github.com/safishamsi/graphify)**

<a href="https://graphifylabs.ai"><img src="https://raw.githubusercontent.com/safishamsi/graphify/v4/docs/logo-text.svg" width="260" height="64" alt="Graphify"/></a>

> The knowledge graph engine that turns folders of notes,  code, papers, and media into a queryable graph your AI tools can traverse.

[Install](#install) · [Quick Start](#quick-start) · [Multiple Brains](#multiple-brains) · [Commands](#commands) · [Template Ownership](#template-ownership) · [Inside AI Tools](#inside-ai-tools) · [New Machine Setup](#new-machine-setup) · [Options](#options) · [Credits](#credits)

</div>

---

## Install

To install the tool globally:

```bash
npm install -g @jorge-moreira.dev/ai-brain-tool
```

Then use anywhere:

```bash
ai-brain <command>
```

> [!NOTE]
> You can also opt to use the tool portable using:
> ```bash
> npx @jorge-moreira.dev/ai-brain-tool <command>
> ```

---

## Quick start

Run the interactive wizard: creates your brain folder, installs graphify, configures every detected AI tool (Claude Code, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, OpenAI Codex CLI), and optionally sets up Obsidian.

```bash
npx @jorge-moreira.dev/ai-brain-tool setup
ai-brain setup
```

---

## Multiple brains

The tool supports multiple brains. Brains configurations are stored in `~/.ai-brain-tool/config.json`.

### Brain identifier

Every brain has a short identifier (e.g., `work`, `personal`) that identifies it. Use `--brain-id <id>` to target a specific brain:

```bash
ai-brain <command> personal
ai-brain <command> --brain-id personal
```

> [!NOTE]
> If you're in a brain folder (or a subfolder), commands automatically detect which brain to use — no need to specify the identifier.

### List brains

```bash
ai-brain list
```

Shows all registered brains with their identifiers and paths.

---

## Commands

### `ai-brain setup`

Run the interactive setup wizard.

- **Fresh machine:** full wizard — creates the brain folder, initialises git, installs graphify, configures AI tools, sets up Obsidian, prompts for brain identifier (defaults to folder name).
- **Inside an existing brain folder** (e.g. after `git clone`): new-machine mode — only recreates `.venv`, patches local AI tool configs, prompts for brain identifier (defaults to folder name).

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
ai-brain setup
```

---

### `ai-brain update`

Rebuild the knowledge graph from `raw/` using graphify. If auto-sync was enabled during setup, commits and pushes after the rebuild.

```bash
ai-brain update                   # Used if already on the brain folder
ai-brain update --brain-id work   # Specify brain by identifier
```

> [!NOTE]
> Inside any AI tool, `/brain update` loads the graphify skill which rebuilds the graph using AI subagents for semantic extraction. If auto-sync was enabled during setup, the skill automatically commits and pushes after the rebuild.

---

### `ai-brain status`

Show brain health: tool version, graphify version, graph node/edge count, brain path.

```bash
ai-brain status         # Used if already on the brain folder
ai-brain status work    # Specify brain by identifier
```

Equivalent inside any AI tool: `status`

---

### `ai-brain templates list`

List all templates — both tool-managed (`_bundled/`) and yours (`_custom/`).

```bash
ai-brain templates list
ai-brain templates list work    # Specify brain by identifier
```

---

### `ai-brain templates add`

Create a new custom template from a minimal starter file. Places the file in `raw/templates/markdown/_custom/` or `raw/templates/web-clipper/_custom/`. Files in `_custom/` are never touched by upgrades.

```bash
ai-brain templates add
ai-brain templates add work    # Specify brain by identifier
```

---

### `ai-brain upgrade`

Upgrade graphify in `.venv/` and refresh all bundled templates in `_bundled/`. Your custom templates in `_custom/` are never touched.

```bash
ai-brain upgrade        # Used if already on the brain folder
ai-brain upgrade work   # Specify brain by identifier
```

---

### `ai-brain list`

List all registered brains with their identifiers and paths.

```bash
ai-brain list
```

---

### `ai-brain setup-obsidian`

Setup or update Obsidian vault configuration for a brain.

```bash
ai-brain setup-obsidian
ai-brain setup-obsidian --update
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
ai-brain setup
```

The tool detects the existing brain, skips scaffolding, and only recreates `.venv` and patches your local AI tool configs.

---

## Options

```
--help, -h      Show help for any command
--version, -v   Show the current tool version
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, testing, and contribution guidelines.

---

## Credits

**ai-brain-tool** is a facade over **[graphify](https://github.com/safishamsi/graphify)** by [@safishamsi](https://github.com/safishamsi). All graph extraction, clustering, wiki generation, Obsidian export, and MCP serving is done by graphify. This tool adds the setup wizard, platform integrations, and `/brain` skill layer on top.
