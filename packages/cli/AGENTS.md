# @jorge-moreira.dev/ai-brain-tool (CLI)

Published npm package — the `ai-brain` CLI command. Depends on `@ai-brain/core` for all business logic.

## What This Package Does

Interactive terminal wizard and CLI commands for brain management. Provides the `ai-brain` binary with subcommands for setup, update, status, upgrade, listing, Obsidian setup, and templates.

## Commands

| Command | Description |
|---------|-------------|
| `ai-brain setup [--non-interactive]` | Setup wizard or new machine detection |
| `ai-brain update [brain-id] [--brain-id <id>]` | Rebuild knowledge graph + git sync |
| `ai-brain status [brain-id] [--brain-id <id>]` | Show brain health |
| `ai-brain upgrade [brain-id] [--brain-id <id>]` | Upgrade graphify, refresh bundled templates |
| `ai-brain list` | List all configured brains |
| `ai-brain setup-obsidian [brain-id] [--update]` | Configure Obsidian vault |
| `ai-brain templates list [brain-id]` | List templates |
| `ai-brain templates add [brain-id]` | Create custom template |

## Build

```bash
bun run build
# Produces dist/index.js (single bundle)
# Also copies: requirements.txt, templates/, brain-skills.md from core
```

## Rules

- **No business logic in CLI** — all logic lives in `@ai-brain/core`. Commands orchestrate core functions and handle I/O only:
  ```typescript
  import { updateBrain } from '@ai-brain/core'
  import chalk from 'chalk'
  import ora from 'ora'

  export function registerUpdate(program: Command) {
    program
      .command('update')
      .action(async (options) => {
        const spinner = ora('Updating brain...')
        spinner.start()
        try {
          await updateBrain(options.brainId)
          spinner.succeed('Brain updated')
        } catch (error) {
          spinner.fail(chalk.red(error.message))
        }
      })
  }
  ```
- **Commander pattern** — every command is a separate file in `src/commands/`, registered in `src/index.ts`
- **Interactive prompts use `@inquirer/prompts`** — never use `readline` or other prompt libraries:
  ```typescript
  import { select, input, checkbox } from '@inquirer/prompts'
  ```
- **`--non-interactive` flag on setup** — must work without any prompts for CI/automation use
- **Error handling** — wrap core calls in try/catch, display user-friendly messages with `chalk`; never expose stack traces
- **Spinners** — use `ora` for long-running operations (graphify install, git sync)
- **`src/index.ts` is excluded from coverage** — it's just Commander registration
- **E2E tests require Docker** — never run them in pre-commit

## Testing

```bash
bun run test                       # unit + integration (excludes e2e)
bun run test:coverage              # with coverage
bun run test:unit                   # unit only
bun run test:integration            # integration only
bun run test:e2e                    # E2E (local Docker)
bun vitest run packages/cli/tests/unit/commands/setup.test.ts  # single file
```

**Coverage thresholds:** 80% lines, functions, branches, statements.

Test structure:
```
tests/
  unit/commands/            # mirrors src/commands/
  integration/commands/     # integration tests per command
  e2e/                     # Docker-based E2E with @amiceli/vitest-cucumber
    features/              # .feature files (Gherkin)
    Dockerfile.e2e
    docker-compose.e2e.yml
```

CI: `cli-test.yml` — unit + integration in parallel matrix; E2E on `main` or PRs with `e2e` label. See root AGENTS.md.

## Adding a New Command

1. Create `src/commands/<name>.ts` (or `src/commands/<group>/<name>.ts` for subcommands)
2. Export a function that registers the command with Commander
3. Import and register in `src/index.ts`
4. Add unit tests in `tests/unit/commands/`
5. Add integration tests in `tests/integration/commands/`
6. For E2E, add a `.feature` file in `tests/e2e/features/`

## Common Gotchas

- **Import `execa` through core** — core re-exports its `execa` usage. Don't import `execa` directly in CLI unless you need it for CLI-specific subprocess calls.
- **The build copies core resources** — `requirements.txt`, `templates/`, `brain-skills.md` are bundled into `dist/`. If you add a new resource in core, update the `build` script in `package.json`.
- **`--brain-id` can be positional or a flag** — commands accept `<brain-id>` as a positional argument OR `--brain-id <id>` as a flag. Both must work.
- **Pre-commit skips for docs-only changes** — the hook checks staged files and auto-skips if only `.md` / `.github/` / `docs/` files changed.