# ai-brain-tool — Design Spec
**Date:** 2026-04-22  
**Status:** Draft

---

## Overview

`ai-brain-tool` is an npm package that scaffolds and manages a personal AI knowledge brain. It is published under the name `ai-brain` so users can run:

```bash
npx ai-brain setup
```

from any machine, with no prior install. Behind the scenes it drives [graphify](https://github.com/safishamsi/graphify) for knowledge graph generation and MCP for AI platform integration — but the user never needs to know either exists. They only interact with `ai-brain` concepts.

The tool lives temporarily in the `tool/` folder of the `ai-brain` reference repo, and will be extracted to its own repo (`ai-brain-tool`) when ready.

---

## Goals

- A developer or non-technical AI-app user can go from zero to a working personal AI brain in one command.
- The brain folder is a self-contained, portable directory (optionally a git repo) that can be synced across machines.
- Every supported AI platform (Claude Code, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, OpenAI Codex CLI) is auto-detected and configured with zero manual JSON/TOML editing.
- Templates (Obsidian markdown + web clipper) are bundled with the tool. New templates ship as new tool versions.
- Users can add their own custom templates (markdown or web clipper) alongside the bundled ones. Custom templates are never overwritten by upgrades.
- Every command has a `--help` flag with usage documentation. A full reference is also written to `tool/README.md`.
- The tool is versioned via npm semver. Users can check for and apply updates with `npx ai-brain@latest`.

---

## What Gets Created on a Fresh Setup

Running `npx ai-brain setup` on a fresh machine produces this folder structure:

```
<brain-name>/                       ← default: ai-brain, user can override
├── .git/                           ← only if user chose git repo mode
├── .gitignore                      ← see Git section below for full contents
├── .obsidian/                      ← only if user chose Obsidian
│   ├── app.json
│   ├── templates.json              ← template plugin config, points to raw/templates/markdown
│   └── community-plugins.json      ← pre-enabled: Templates, Web Clipper
├── .venv/                          ← Python venv with graphify[mcp] installed
├── .graphifyignore                 ← excludes raw/templates/ from graph indexing
├── AGENTS.md                       ← graphify rules injected for all AI tools
├── raw/
│   ├── notes/                      ← empty, ready for user notes
│   ├── articles/                   ← empty
│   ├── projects/                   ← empty
│   ├── documentation/              ← empty
│   └── templates/
│       ├── markdown/
│       │   ├── _bundled/           ← tool-owned, rewritten freely on upgrade
│       │   │   ├── book-template.md
│       │   │   ├── course-template.md
│       │   │   ├── daily-note-template.md
│       │   │   ├── exploration-template.md
│       │   │   ├── lecture-template.md
│       │   │   ├── meeting-template.md
│       │   │   ├── paper-template.md
│       │   │   ├── person-template.md
│       │   │   ├── project-template.md
│       │   │   ├── prompt-template.md
│       │   │   ├── quote-template.md
│       │   │   ├── term-template.md
│       │   │   ├── thought-template.md
│       │   │   └── tool-template.md
│       │   └── _custom/            ← user-owned, never touched by upgrade
│       │       └── (user templates created here via "templates add")
│       └── web-clipper/
│           ├── _bundled/           ← tool-owned, rewritten freely on upgrade
│           │   ├── article-template.json
│           │   ├── documentation-template.json
│           │   └── youtube-template.json
│           └── _custom/            ← user-owned, never touched by upgrade
│               └── (user templates created here via "templates add")
└── graphify-out/                   ← empty until first graph build
```

**Ownership rules:**
- `_bundled/` is fully owned by the tool. `upgrade` rewrites it entirely — no file in `_bundled/` is ever preserved between upgrades. Users should never manually edit files there.
- `_custom/` is fully owned by the user. The tool creates this folder during setup and places new templates here via `templates add`. The tool never reads, modifies, or deletes anything in `_custom/`. No manifest needed — ownership is determined entirely by which folder the file lives in.
- No collision is possible between bundled and custom templates because they live in separate directories.

### `npx ai-brain templates` command

```
$ npx ai-brain templates

  Markdown templates
  ──────────────────────────────────────────────────────────
  _bundled/ (tool-managed)
  ✔ book-template.md            v1.0.0  up to date
  ✔ course-template.md          v1.0.0  up to date
  ✔ daily-note-template.md      v1.0.0  up to date
  ...

  _custom/ (yours)
  ✔ research-interview-template.md

  Web Clipper templates
  ──────────────────────────────────────────────────────────
  _bundled/ (tool-managed)
  ✔ article-template.json       v1.0.0  up to date
  ✔ documentation-template.json v1.0.0  up to date
  ✔ youtube-template.json       v1.0.0  up to date

  _custom/ (yours)
  ✔ my-podcast-clipper.json

  Run "npx ai-brain templates add" to create a new custom template.
  Run "npx ai-brain upgrade" to update bundled templates to the latest tool version.
```

### `npx ai-brain templates add` subcommand

Guides the user to create a new custom template from a minimal starter file, placed in `_custom/`:

```
$ npx ai-brain templates add

? Template type:
  ❯ Markdown (for Obsidian notes)
    Web Clipper (for browser clipping)

? Template name: (my-template)
  > research-interview

  ✔ Created raw/templates/markdown/_custom/research-interview-template.md
    Open it in your editor and fill in the frontmatter and body.
    This file lives in _custom/ and will never be modified by ai-brain upgrades.
```

The starter files are minimal scaffolds (frontmatter block for markdown, valid JSON skeleton for web clipper) rather than empty files, so the user has the correct structure from the start.

---

---

## Setup Wizard Flow

There are two entry points:

1. **Fresh setup** — no brain folder exists yet, wizard runs in full.
2. **New machine setup** — user has cloned an existing brain repo, runs `npx ai-brain setup` inside it. The tool detects the existing structure (presence of `raw/`, `AGENTS.md`, `.graphifyignore`), skips scaffolding and git init, and only: recreates `.venv/`, detects and patches local AI CLI configs, and installs platform skills.

### Fresh setup

```
$ npx ai-brain setup

  ╔════════════════════════════════════╗
  ║   ai-brain setup wizard v1.0.0     ║
  ╚════════════════════════════════════╝

  Your personal AI memory, connected to all your AI tools.

? Brain folder name: (ai-brain)
  > _                              ← user types name or presses Enter for default

? Where do you want to create it?
  ❯ Current directory              ~/
    Choose a different location    (prompts for path)

? How do you want to manage your brain?
  ❯ Git repository (recommended)   sync across machines via git
    Local folder only              this machine only

  [if git repo chosen]
? Git remote URL (optional — leave blank to init locally, add remote later)
  > _

  ✔ Created ~/ai-brain/
  ✔ Initialized git repo
  ✔ Created .venv and installed graphify[mcp]

? Commit extraction cache to git?
  ❯ Yes — unchanged files skip re-extraction on any machine, saving AI tokens (recommended)
    No  — keep repo smaller, but every new machine re-extracts everything from scratch

  [cache choice written to .gitignore accordingly]

? Which AI tools do you use? (auto-detected — space to toggle, enter to confirm)
  ✔ Claude Code          detected at ~/.claude/
  ✔ OpenCode             detected at ~/.config/opencode/
  ◯ Cursor               not detected (you can still enable it)
  ◯ Gemini CLI           not detected
  ◯ GitHub Copilot CLI   not detected
  ◯ OpenAI Codex CLI     not detected

  ✔ Patched ~/.claude/mcp.json
  ✔ Patched ~/.config/opencode/opencode.json
  ✔ Installed /brain skill → Claude Code
  ✔ Installed /brain skill → OpenCode

? Do you use Obsidian?
  ❯ Yes, use this brain folder as my Obsidian vault
    Yes, I have a separate Obsidian vault
    No / Skip

  [if separate vault chosen]
? Path to your Obsidian vault:
  > ~/Documents/Obsidian/MyVault

  ✔ Created .obsidian/ with template plugin config
  ✔ Installed 15 markdown templates → raw/templates/markdown/
  ✔ Installed 3 web clipper templates → raw/templates/web-clipper/

? Build the knowledge graph now?
  ❯ Skip for now — I'll add notes to raw/ first
    Yes, build it (raw/ is empty, graph will be minimal)

  ╔════════════════════════════════════════════════════════╗
  ║   Setup complete!                                      ║
  ╠════════════════════════════════════════════════════════╣
  ║                                                        ║
  ║   Brain:     ~/ai-brain                               ║
  ║   Git:       initialized (no remote yet)              ║
  ║   Platforms: Claude Code, OpenCode                    ║
  ║   Obsidian:  vault configured                         ║
  ║                                                        ║
  ║   Next steps:                                         ║
  ║   1. Restart Claude Code and OpenCode                 ║
  ║   2. Drop notes into ~/ai-brain/raw/                  ║
  ║   3. Run:  npx ai-brain update                        ║
  ║      or:   /brain update  in your AI tool             ║
  ║                                                        ║
  ║   Obsidian:                                           ║
  ║   4. Open Obsidian → Open folder → ~/ai-brain        ║
  ║   5. Enable: Templates plugin (already configured)    ║
  ║   6. Import web clipper templates from:               ║
  ║      raw/templates/web-clipper/README.md              ║
  ╚════════════════════════════════════════════════════════╝
```

---

## Ongoing Commands

After setup, the user interacts with the tool in two ways:

### Terminal

Every command and subcommand supports `--help`:

```bash
npx ai-brain --help              # top-level help: lists all commands
npx ai-brain setup --help        # help for setup wizard
npx ai-brain update --help       # help for update
npx ai-brain templates --help    # help for templates command
npx ai-brain templates add --help
npx ai-brain upgrade --help
npx ai-brain status --help
```

Top-level `--help` output:

```
$ npx ai-brain --help

  ai-brain — your personal AI memory

  Usage: ai-brain <command> [options]

  Commands:
    setup           Run the interactive setup wizard (first-time use)
    update          Rebuild the knowledge graph and sync via git
    status          Show brain health: version, graph stats, MCP connection
    templates       List, add, and manage note templates
    upgrade         Update graphify and pull new bundled templates
    help            Show this help message

  Options:
    --help, -h      Show help for any command
    --version, -v   Show the current tool version

  Examples:
    npx ai-brain setup
    npx ai-brain update
    npx ai-brain templates add
    npx ai-brain status

  Docs: https://github.com/your-org/ai-brain-tool
```

Full command reference:

```bash
npx ai-brain setup               # interactive wizard — first-time setup
npx ai-brain update              # rebuild graph from raw/, git commit+push if git repo
npx ai-brain status              # tool version, graphify version, node/edge count, MCP status
npx ai-brain templates           # list all templates (bundled + custom), flag outdated bundled ones
npx ai-brain templates add       # create a new custom template from a starter file
npx ai-brain upgrade             # update graphify in .venv, add new bundled templates (never overwrites custom)
```

### Inside AI tools (via installed skill/slash command)

```
/brain update
/brain status
/brain query "what do I know about machine learning?"
```

The `/brain` skill is installed into each platform during setup. It calls the MCP server's exposed tools:

| MCP Tool | Description |
|---|---|
| `brain_update` | Rebuild graph from raw/, optionally git sync |
| `brain_status` | Return health info: version, node/edge count, last build |
| `brain_query` | Query the graph (wraps graphify query) |
| `brain_path` | Shortest path between two concepts |
| `brain_explain` | Explain a concept from the graph |

---

## Platform Support

| Platform | Config file patched | Skill installed |
|---|---|---|
| Claude Code | `~/.claude/mcp.json` | `~/.claude/commands/brain.md` |
| OpenCode | `~/.config/opencode/opencode.json` | `.opencode/` skill |
| Cursor | `~/.cursor/mcp.json` | rules file |
| Gemini CLI | `~/.gemini/settings.json` | `~/.gemini/` skill |
| GitHub Copilot CLI | platform skill install | `/brain` alias |
| OpenAI Codex CLI | `~/.codex/config.toml` | `/brain` alias |

Detection: the tool checks for the existence of the config directory for each platform. Undetected platforms are shown unchecked in the wizard but can be manually enabled.

---

## Git Setup

When the user chooses git repo mode, the tool runs `git init` (and optionally `git remote add origin <url>`), then writes the following `.gitignore`:

```gitignore
# macOS
.DS_Store

# Python environment — recreated by "npx ai-brain setup" on a new machine
.venv/
venv/
__pycache__/
*.pyc

# Graphify local artifacts — keep the graph output, ignore machine-specific cache/state
# graphify-out/cache/ is included or excluded based on user choice during setup (see below)
graphify-out/.graphify_*
graphify-out/manifest.json
graphify-out/cost.json

# Obsidian — keep plugin config and settings, ignore machine-specific workspace state
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
```

**What gets committed and why:**

| Path | Committed | Reason |
|---|---|---|
| `raw/` | ✅ yes | The entire point of the repo — all notes and templates |
| `graphify-out/graph.json` | ✅ yes | Graph available immediately after `git pull`, no rebuild needed |
| `graphify-out/GRAPH_REPORT.md` | ✅ yes | AI tools use this for architecture context |
| `graphify-out/graph.html` | ✅ yes | Visual graph view available cross-machine |
| `graphify-out/cache/` | ⚙️ user choice | Cache keys are content-addressed, making it fully portable across machines. Committing it means unchanged files skip re-extraction on any machine, saving AI API tokens. Skipping keeps the repo smaller but re-extracts everything from scratch on each new machine. Default: commit it. |
| `graphify-out/.graphify_*` | ❌ no | Internal graphify state files |
| `graphify-out/manifest.json` | ❌ no | Graphify internal manifest, regenerated on build |
| `graphify-out/cost.json` | ❌ no | Graphify API cost tracking, local only |
| `AGENTS.md` | ✅ yes | AI tool config, same across machines |
| `.obsidian/app.json` | ✅ yes | Basic Obsidian app settings |
| `.obsidian/appearance.json` | ✅ yes | Theme settings |
| `.obsidian/core-plugins.json` | ✅ yes | Which plugins are enabled |
| `.obsidian/templates.json` | ✅ yes | Template folder config — points at `_bundled/` |
| `.obsidian/graph.json` | ✅ yes | Graph view settings |
| `.obsidian/workspace.json` | ❌ no | Open tabs, cursor positions, window state — machine-specific |
| `.obsidian/workspace-mobile.json` | ❌ no | Mobile workspace state |
| `.obsidian/cache` | ❌ no | Binary cache, not portable |
| `.venv/` | ❌ no | Python environment — recreated by setup tool on new machine |

On a new machine after `git pull`, the user runs `npx ai-brain setup` which detects the existing brain folder, skips scaffolding, only recreates `.venv/` and patches the local AI CLI configs.

---

## Versioning

- The npm package uses **semver**: `MAJOR.MINOR.PATCH`
  - **PATCH**: bug fixes
  - **MINOR**: new templates, new platform support, non-breaking changes
  - **MAJOR**: breaking changes to brain folder structure or MCP API
- `npx ai-brain status` shows the current installed tool version and whether a newer version exists on npm.
- `npx ai-brain upgrade` updates the graphify dependency in `.venv/` and rewrites `raw/templates/markdown/_bundled/` and `raw/templates/web-clipper/_bundled/` entirely with the latest templates from the new tool version. `_custom/` folders are never touched. No manifest is needed — folder location determines ownership.

---

## Package Structure (tool/ folder)

```
tool/
├── bin/
│   └── ai-brain.js              ← CLI entry point, routes to commands
├── src/
│   ├── commands/
│   │   ├── setup.js             ← interactive wizard (uses @inquirer/prompts)
│   │   ├── update.js            ← rebuild graph + git sync
│   │   ├── status.js            ← health check
│   │   ├── templates.js         ← list _bundled/ and _custom/ templates
│   │   ├── templates-add.js     ← create new template in _custom/ from starter
│   │   └── upgrade.js           ← upgrade graphify + rewrite _bundled/ templates
│   ├── platforms/
│   │   ├── index.js             ← detect all platforms
│   │   ├── claude.js
│   │   ├── opencode.js
│   │   ├── cursor.js
│   │   ├── gemini.js
│   │   ├── copilot.js
│   │   └── codex.js
│   ├── mcp/
│   │   └── server.js            ← MCP server, wraps graphify CLI calls
│   ├── scaffold.js              ← creates brain folder structure including _bundled/ and _custom/
│   ├── graphify.js              ← wrapper: install, run, update graphify via .venv
│   └── templates/               ← bundled templates (source of truth, copied to _bundled/ on setup/upgrade)
│       ├── markdown/
│       │   ├── _bundled/        ← 14 .md templates
│       │   └── _starter.md      ← scaffold for "templates add" → _custom/
│       ├── web-clipper/
│       │   ├── _bundled/        ← 3 .json templates
│       │   └── _starter.json    ← scaffold for "templates add" → _custom/
│       └── obsidian/            ← .obsidian config files (app.json, templates.json)
├── docs/
│   └── specs/
│       └── 2026-04-22-ai-brain-tool-design.md
├── package.json
└── README.md                    ← full command reference documentation
```

### Key dependencies

```json
{
  "name": "ai-brain",
  "bin": { "ai-brain": "./bin/ai-brain.js" },
  "dependencies": {
    "@inquirer/prompts": "^7.0.0",
    "chalk": "^5.0.0",
    "commander": "^12.0.0",
    "execa": "^9.0.0",
    "ora": "^8.0.0",
    "semver": "^7.0.0"
  }
}
```

- `@inquirer/prompts` — interactive terminal wizard (arrow-key menus, checkboxes)
- `chalk` — colored terminal output
- `commander` — command/subcommand routing, automatic `--help` generation for every command
- `execa` — run shell commands (graphify, git, python/uv) safely
- `ora` — spinners for async steps (venv creation, graph build)
- `semver` — version comparison for upgrade checks

---

## Error Handling

- If Python 3.10+ is not found: print clear message with download link, abort setup.
- If `uv` is not found: fall back to `pip`, warn that `uv` is recommended.
- If a platform config file already has an `"ai-brain"` entry: skip patching, notify user.
- If git remote push fails: continue setup, warn user to add remote manually.
- If graphify build fails: continue setup, show error, tell user to run `npx ai-brain update` after fixing.
- All errors are caught and displayed with actionable messages — no raw stack traces shown to the user.

---

## Out of Scope (v1)

- GUI / web wizard (terminal only)
- Hosted template registry (templates are bundled, updated via npm)
- Windows PowerShell support (bash/zsh only in v1, Windows via WSL)
- Auto-restart of AI CLI platforms after config patching
