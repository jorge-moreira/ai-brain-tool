# @ai-brain/core

Private package — shared business logic for ai-brain-tool. Used by both `cli` and `app`.

## What This Package Does

Config management, Graphify/Python integration, AI platform integrations (6 tools), brain scaffolding, git sync, MCP tool definitions, and update orchestration.

## Installation

```bash
# From monorepo root
bun install
```

This package is private and not published to npm. It is used internally by:
- `@jorge-moreira.dev/ai-brain-tool` (CLI)
- `@ai-brain/app` (Desktop App)

## Usage

Import from subpaths:

```typescript
import { resolveBrain, getBrains } from '@ai-brain/core/config'
import { installGraphify, runGraphify } from '@ai-brain/core/graphify'
import { detectAll, configureSelected } from '@ai-brain/core/platforms'
import { updateBrain, BrainNotFoundError } from '@ai-brain/core'
```

## API Reference

### Config

```typescript
import { readConfig, writeConfig, getConfigDir } from '@ai-brain/core/config'
```

### Graphify

```typescript
import { installGraphify, runGraphify, getGraphifyVersion } from '@ai-brain/core/graphify'
```

### Platforms

```typescript
import { detectAll, configureSelected, type Platform } from '@ai-brain/core/platforms'
```

Supported platforms: Claude Code, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, OpenAI Codex CLI

### Core

```typescript
import { updateBrain, resolveBrain, BrainNotFoundError } from '@ai-brain/core'
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and [AGENTS.md](AGENTS.md) for AI assistant instructions.

## Testing

```bash
# From monorepo root
bun run test:core
bun run test:core:unit
bun run test:core:integration
```

## License

MIT
