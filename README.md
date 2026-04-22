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

## Obsidian setup

[Download Obsidian](https://obsidian.md/download) if you haven't already.

During `ai-brain setup`, if you choose to use your brain folder as an Obsidian vault, the tool will:

- Pre-configure the **Templates plugin** pointing at `raw/templates/markdown/_bundled/`
- Copy the bundled `.obsidian/` config files (app, appearance, graph, core plugins)

### Markdown templates

14 note templates are bundled and ready to use immediately via Obsidian's Templates plugin (`raw/templates/markdown/_bundled/`):

| Template | Purpose |
|---|---|
| `book-template.md` | Book notes and reviews |
| `course-template.md` | Online course notes |
| `daily-note-template.md` | Daily journal entries |
| `exploration-template.md` | Open-ended research |
| `lecture-template.md` | Lecture and talk notes |
| `meeting-template.md` | Meeting notes |
| `paper-template.md` | Academic paper notes |
| `person-template.md` | People and contacts |
| `project-template.md` | Project tracking |
| `prompt-template.md` | AI prompt library |
| `quote-template.md` | Quotes and highlights |
| `term-template.md` | Glossary definitions |
| `thought-template.md` | Ideas and thoughts |
| `tool-template.md` | Tool and software notes |

To use them: open Obsidian → Command Palette → **"Templates: Insert template"**.

> To add your own, run `ai-brain templates add` — new templates go into `_custom/` and are never overwritten on upgrade.

### Web Clipper templates

3 web clipper templates are bundled (`raw/templates/web-clipper/_bundled/`):

| Template | Purpose |
|---|---|
| `article-template.json` | Clip articles from the web |
| `documentation-template.json` | Clip documentation pages |
| `youtube-template.json` | Clip YouTube videos |

These **cannot be imported automatically** — you need to import each `.json` file manually into the Obsidian Web Clipper browser extension.

**Steps:**

1. Install the [Obsidian Web Clipper](https://obsidian.md/clipper) browser extension
2. Open the extension → **Settings** → **Templates**
3. For each `.json` file in `raw/templates/web-clipper/_bundled/`, click **Import template** and select the file
4. See the [Web Clipper templates documentation](https://obsidian.md/help/web-clipper/templates) for full details on customising or creating your own

> To create a custom web clipper template, run `ai-brain templates add` and select **Web Clipper**. The starter `.json` will be placed in `raw/templates/web-clipper/_custom/`.

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
