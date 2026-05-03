# Contributing to ai-brain-tool

We want to make it easy for you to contribute to ai-brain-tool.

## What we look for

- Bug fixes
- New features and improvements
- Documentation improvements
- Test improvements

If you're unsure if a PR would be accepted, feel free to ask a maintainer or look for issues with labels like `help wanted`, `good first issue`, or `bug`.

## Developing ai-brain-tool

### Requirements

- Bun 1.0+ (or Node.js 18+)

### Install dependencies

```bash
# With bun (faster)
bun install

# With npm
npm install
```

### Running the CLI

```bash
# With bun
bun start

# With npm
npm start
```

### Running tests

```bash
# With bun
bun test

# With npm
npm test

# With coverage
bun run test:coverage
```

**Coverage requirements:** All PRs must maintain 85%+ code coverage.

### Test Structure

Tests are organized by category:

| Category | Location | CI Job | Runs on |
|----------|----------|--------|---------|
| Unit | `tests/**/*.test.js` | `unit` | All PRs + main |
| Smoke | `tests/commands/*.test.js` | `smoke` | All PRs + main |
| Integration | `tests/platforms/*.test.js` | `integration` | All PRs + main |
| E2E | `scripts/e2e-test.sh` | `e2e` | Main + PRs with `e2e` label |

**To run e2e tests on a PR:** Add the `e2e` label and push a new commit (or manually re-run the workflow).

### Project structure

```
src/
├── commands/           # CLI commands (setup, update, status, templates, etc.)
├── platforms/          # AI tool integrations (Claude, Cursor, Gemini, etc.)
├ ├── shared.js         # Shared platform helpers
├ ├── claude.js         # Claude Code integration
├ ├── opencode.js       # OpenCode integration
├ ├── cursor.js         # Cursor integration
├ ├── gemini.js         # Gemini CLI integration
├ ├── copilot.js        # GitHub Copilot CLI integration
├ └── codex.js          # OpenAI Codex CLI integration
├── config.js           # Configuration management
├── scaffold.js         # Brain scaffolding
├── templates-lib.js    # Template handling
├── graphify.js         # Graphify Python venv management
├── git.js              # Git operations
└── mcp/
    └── server.js       # MCP server documentation

tests/
├── commands/           # Command tests
├── platforms/          # Per-platform integration tests
├── mcp/                # MCP server tests
└── *.test.js           # Core module tests

scripts/
└── e2e-test.sh         # End-to-end test script

.github/workflows/
├── ci.yml              # Main CI (legacy)
├── test.yml            # Test workflow (unit, smoke, integration, e2e)
├── release.yml         # Release automation
└── commitlint.yml      # Commit message linting
```

## Pull Requests

### Issue First Policy

**All PRs must reference an existing issue.** Before opening a PR, open an issue describing the bug or feature. Use `Fixes #123` or `Closes #123` in your PR description to link the issue.

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages must follow this format:

```
<type>(<scope>): <description>
```

**Types:**
- `feat` — new feature or functionality
- `fix` — bug fix
- `docs` — documentation or README changes
- `chore` — maintenance tasks, dependency updates
- `refactor` — code refactoring without changing behavior
- `test` — adding or updating tests
- `style` — code style changes (formatting, semicolons, etc.)

**Examples:**
```
feat: add bun support for faster installs
fix: resolve gitSync being ignored in /brain update
docs: update contributing guidelines
chore: update graphify version
```

### General Requirements

- Keep pull requests small and focused
- Explain the issue and why your change fixes it
- Ensure all tests pass before submitting
- Maintain 85%+ code coverage
- Follow existing code style and patterns

### CI Checks

All PRs run the following checks automatically:

1. **Unit tests** - All tests in `tests/` with coverage reporting
2. **Smoke tests** - Command-level tests (`tests/commands/`)
3. **Integration tests** - Platform integration tests (`tests/platforms/`)
4. **E2E tests** - Full end-to-end test (only on `main` or PRs with `e2e` label)

**Before pushing:** Run `bun run test:coverage` locally to verify tests pass and coverage is adequate.

## Issue Templates

This project uses GitHub issue templates. When opening an issue, please use the appropriate template:

- **Bug report** — for reporting bugs (requires description and reproduction steps)
- **Feature request** — for suggesting enhancements (requires verification that it hasn't been suggested before)

## Translating the README

`README.md` and the per-language `docs/i18n/README.<lang>.md` files are auto-generated from `README.src.md`. **Don't edit them directly** — the next regeneration overwrites your changes.

To add a new language (example: French / `fr`):

1. Edit `README.src.md`.
2. Add `fr` to `<!--@nrg.languages=en,es-->` near the top → `<!--@nrg.languages=en,es,fr-->`.
3. Add `<!--@nrg.fileNamePattern.fr=docs/i18n/README.fr.md-->` so the output file lands under `docs/i18n/`.
4. For each line tagged `<!--en-->`, add a parallel line with your French translation tagged `<!--fr-->`. Lines without a marker are shared across every language.
5. Open a PR. On merge to `main`, the regenerate job commits the new `docs/i18n/README.fr.md` automatically.

To update an existing translation, edit only the lines tagged with that language inside `README.src.md`. The drift-check job on PRs will fail if a generated file was hand-edited, with a clear diff pointing back at `README.src.md`.

See [`.github/workflows/nrg.yml`](.github/workflows/nrg.yml) for the active workflow and [nanolaba/readme-generator](https://github.com/nanolaba/readme-generator) for the full template syntax reference.