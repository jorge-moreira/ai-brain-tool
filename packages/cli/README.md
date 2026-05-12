# @jorge-moreira.dev/ai-brain-tool (CLI)

The `ai-brain` command-line tool for managing your AI knowledge graphs.

## What This Package Does

Interactive terminal wizard and CLI commands for brain management. Provides the `ai-brain` binary with subcommands for setup, update, status, upgrade, listing, Obsidian setup, and templates.

## Installation

```bash
# Global install (recommended)
npm install -g @jorge-moreira.dev/ai-brain-tool

# Or use with npx (no install required)
npx @jorge-moreira.dev/ai-brain-tool <command>
```

## Quick Start

```bash
# Run the interactive setup wizard
ai-brain setup

# Or use npx
npx @jorge-moreira.dev/ai-brain-tool setup
```

## Commands

### `ai-brain setup`

Run the interactive setup wizard.

- **Fresh machine:** Full wizard — creates the brain folder, initializes git, installs graphify, configures AI tools, sets up Obsidian, prompts for brain identifier (defaults to folder name).
- **Inside an existing brain folder** (e.g., after `git clone`): New-machine mode — only recreates `.venv`, patches local AI tool configs, prompts for brain identifier (defaults to folder name).

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
ai-brain update                   # Use if already in the brain folder
ai-brain update work              # Specify brain by identifier
ai-brain update --brain-id work   # Alternative syntax
```

> [!NOTE]
> Inside any AI tool, `/brain update` loads the graphify skill which rebuilds the graph using AI subagents for semantic extraction. If auto-sync was enabled during setup, the skill automatically commits and pushes after the rebuild.

---

### `ai-brain status`

Show brain health: tool version, graphify version, graph node/edge count, brain path.

```bash
ai-brain status         # Use if already in the brain folder
ai-brain status work    # Specify brain by identifier
```

Equivalent inside any AI tool: `/brain status`

---

### `ai-brain upgrade`

Upgrade graphify in `.venv/` and refresh all bundled templates in `_bundled/`. Your custom templates in `_custom/` are never touched.

```bash
ai-brain upgrade        # Use if already in the brain folder
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

## Multiple Brains

The tool supports multiple brains. Brains configurations are stored in `~/.ai-brain-tool/config.json`.

### Brain Identifier

Every brain has a short identifier (e.g., `work`, `personal`) that identifies it. Use `--brain-id <id>` to target a specific brain:

```bash
ai-brain <command> personal
ai-brain <command> --brain-id personal
```

> [!NOTE]
> If you're in a brain folder (or a subfolder), commands automatically detect which brain to use — no need to specify the identifier.

---

## Inside AI Tools

After setup, a `/brain` skill is installed in each configured AI tool. Commands run from inside the brain folder manage the brain; query commands work from any project.

```
/brain update              — Rebuild graph from raw/ (+ auto-sync if enabled)
/brain add <url>           — Fetch a URL and add it to raw/
/brain templates           — List available templates
/brain wiki                — Generate agent-crawlable wiki (graphify-out/wiki/)
/brain obsidian            — Generate Obsidian vault export
/brain query "<question>"  — Query the knowledge graph via MCP
/brain path "<A>" "<B>"    — Find shortest path between two concepts via MCP
/brain status              — Show graph stats and tool version
```

---

## Template Ownership

```
raw/templates/
├── markdown/
│   ├── _bundled/    ← Tool-owned, rewritten on upgrade
│   └── _custom/     ← Yours, never touched by the tool
└── web-clipper/
    ├── _bundled/    ← Tool-owned, rewritten on upgrade
    └── _custom/     ← Yours, never touched by the tool
```

---

## Options

```
--help, -h      Show help for any command
--version, -v   Show the current tool version
```

---

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and [AGENTS.md](AGENTS.md) for AI assistant instructions.

```bash
# From monorepo root
bun install
bun run cli:start
```

## Testing

```bash
# From monorepo root
bun run test:cli
bun run test:cli:unit
bun run test:cli:integration
bun run test:cli:e2e  # Requires Docker

# Single test file
bun vitest run packages/cli/tests/unit/commands/setup.test.ts
```

## License

MIT
