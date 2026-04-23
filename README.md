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
npx ai-brain setup
```

---

### `ai-brain update`

Rebuild the knowledge graph from `raw/` using graphify. If auto-sync was enabled during setup (`.brain-config.json: { "gitSync": true }`), commits and pushes after the rebuild with a meaningful message based on what changed.

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

After setup, a `/brain` skill is installed in each configured AI tool. Commands run from inside the brain folder manage the brain; query commands work from any project.

```
/brain update              — rebuild graph from raw/ (+ auto-sync if enabled)
/brain add <url>           — fetch a URL and add it to raw/
/brain templates           — list available templates
/brain query "<question>"  — query the knowledge graph via MCP
/brain path "<A>" "<B>"    — find shortest path between two concepts via MCP
/brain status              — show graph stats and tool version
```

---

## New machine setup

After cloning your brain repo on a new machine:

```bash
cd your-brain
npx ai-brain setup
```

The tool detects the existing brain, skips scaffolding, and only recreates `.venv` and patches your local AI tool configs.

---

## Options

```
--help, -h      Show help for any command
--version, -v   Show the current tool version
```
