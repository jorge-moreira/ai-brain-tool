# AI Brain Tool — Monorepo

## What This Is

A monorepo for **ai-brain-tool**: a personal AI memory tool that connects knowledge graphs to AI tools. Powered by [graphify](https://github.com/safishamsi/graphify).

## Packages

| Package | Purpose | Publishes |
|---------|---------|-----------|
| `packages/core` | Business logic: config, graphify, platforms, scaffold, git, MCP | No |
| `packages/cli` | CLI tool (`ai-brain` command) | Yes — `@jorge-moreira.dev/ai-brain-tool` |
| `packages/ui` | React component library (shadcn/ui + Tailwind v4) | No |
| `packages/app` | ElectroBun desktop app (macOS) | No |

**Dependency graph:** `cli → core`, `app → core + ui`, `ui` (standalone).

Each package has its own `AGENTS.md` with package-specific rules. Always read it when working in that package.

## Commands

```bash
bun install                    # Install all dependencies
bun run format                 # Format with Prettier
bun run format:check           # Check formatting
bun run lint                   # Lint with ESLint
bun run lint:fix               # Lint and fix
bun run test                   # Run all package tests
bun run test:core              # Core tests only
bun run test:cli               # CLI tests only
bun run test:cli:e2e           # CLI E2E tests (Docker, local only)
bun run app:dev                # Start desktop app dev server (HMR)
bun run app:build              # Build desktop app
bun run cli:start              # Run CLI locally
```

Run a single test file:
```bash
bun vitest run packages/core/tests/unit/config/state.test.ts
bun vitest run packages/cli/tests/unit/commands/setup.test.ts
```

## Code Rules

- **Language:** TypeScript strict mode, ES2022+, ESM modules
- **Runtime:** Bun (package manager + runner). Node.js 18+ also supported.
- **No comments** in code — self-documenting code only
- **Package manager:** Bun only. `package-lock.json` is gitignored.
- **Release:** semantic-release from CI. Never manually bump versions.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint.

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

Examples:
```
feat(platforms): add xcode support
fix(config): resolve path resolution on windows
docs: update setup command description
```

### Linting & Formatting

ESLint flat config (`typescript-eslint` strict + `prettier`).

Key rules:
- `no-explicit-any` → warn
- `no-unused-vars` → error (use `_` prefix for unused)
- `no-unsafe-*` → warn
- `prettier/prettier` → error

## Husky Hooks

- **pre-commit:** Runs unit tests for `core` and `cli` in parallel. **Skipped automatically** if only docs/workflow files changed. Do not skip manually.
- **commit-msg:** Runs `commitlint` to validate format. Invalid commits are rejected.

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | PR to `main`/`feature/app`, push to `main` | Orchestrates `core-test` + `cli-test` |
| `core-test.yml` | Called by `ci.yml` | Unit + integration → Codecov |
| `cli-test.yml` | Called by `ci.yml` | Unit + integration → Codecov; E2E on `main` or `e2e` label |
| `app-test.yml` | Called by `ci.yml` | Unit + integration → Codecov (not yet wired into ci.yml) |
| `commitlint.yml` | PR to `main`/`feature/app` | Validates commit messages |
| `release.yml` | After CI succeeds on `main` | semantic-release → npm publish → GitHub Release → bug-report template update |
| `nrg.yml` | Push/PR to `main` | Auto-generates multilingual README from `README.src.md` |

E2E on a PR: add the `e2e` label, then push a commit or re-run the workflow.

## Architecture

- **Bun workspaces** with catalog for shared dependency versions
- Each package has its own `tsconfig.json`; root is the base
- CLI built with `bun build` into single `dist/index.js` bundle
- Core exports via subpath (`@ai-brain/core`, `@ai-brain/core/config`, etc.)
- UI exports `@ai-brain/ui` (components) + `@ai-brain/ui/styles/globals.css`
- App: Bun process (backend) + WebView (React frontend) → typed RPC bridge

## Before Committing

1. `bun run lint` — fix errors (skip at your peril: CI will catch them)
2. `bun run format:check` — must be clean
3. `bun run test` — must pass
4. Pre-commit hook runs unit tests automatically; don't skip it

## PR Policy

- All PRs must reference an issue: `Fixes #123` or `Closes #123`
- Keep PRs small and focused
- 85%+ code coverage required

## Common Gotchas

- **Pre-commit hook failing?** It runs `bun run --cwd packages/core test:unit` and `bun run --cwd packages/cli test:unit` in parallel. If only docs changed, it auto-skips.
- **Commit rejected?** Check format: `feat(scope): description` — no uppercase, no period at end, scope is optional.
- **ESLint `no-explicit-any` is a warning, not an error** — but CI coverage gates will still fail if types are unsound.
- **`bun run test` runs all packages** — use `bun run test:core` or `bun run test:cli` to scope.
- **E2E tests need Docker** — only run locally with `bun run test:cli:e2e`. Never in pre-commit.
- **`README.md` is auto-generated** from `README.src.md` — never edit it directly. Edit `README.src.md` and the `nrg` workflow regenerates it.
- **`chalk` and `ora` are dev deps in core** but used at runtime in graphify output — they're bundled by the CLI build, so this is fine.