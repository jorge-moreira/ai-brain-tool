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
```

### Project structure

```
src/
├── commands/       # CLI commands (setup, update, status, etc.)
├── config.js       # Configuration management
├── scaffold.js     # Brain scaffolding
└── templates.js    # Template handling

tests/              # Test files (Vitest)
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

## Issue Templates

This project uses GitHub issue templates. When opening an issue, please use the appropriate template:

- **Bug report** — for reporting bugs (requires description and reproduction steps)
- **Feature request** — for suggesting enhancements (requires verification that it hasn't been suggested before)