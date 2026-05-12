# @ai-brain/core

Private package — shared business logic for ai-brain-tool. Used by both `cli` and `app`.

## What This Package Does

Config management, Graphify/Python integration, AI platform integrations (6 tools), brain scaffolding, git sync, MCP tool definitions, and update orchestration.

## Key Entry Points

```
src/index.ts          — barrel export of all modules
src/config/index.ts   — config subpath export
src/graphify.ts       — graphify subpath export
src/platforms/index.ts — platforms subpath export
```

Import patterns:
```typescript
import { resolveBrain, getBrains } from '@ai-brain/core/config'
import { installGraphify, runGraphify } from '@ai-brain/core/graphify'
import { detectAll, configureSelected } from '@ai-brain/core/platforms'
import { updateBrain, BrainNotFoundError } from '@ai-brain/core'
```

Wildcard exports (`@ai-brain/core/*`) also map to `src/*.ts`.

## Rules

- **No private state outside `state.ts`** — all config reads/writes go through the config module:
  ```typescript
  import { readConfig, writeConfig } from '@ai-brain/core/config'
  ```
- **Platform modules follow the interface** — every platform exports `detect()` and returns an object with `name`, `patch`, `installSkill`, etc. See `platforms/index.ts` for the registry pattern.
- **Error classes live in `errors.ts`** — never create inline errors:
  ```typescript
  import { BrainNotFoundError, GraphifyError } from '@ai-brain/core'
  throw new BrainNotFoundError(brainPath)
  ```
- **Path resolution via `path-utils.ts`** — never hardcode paths:
  ```typescript
  import { getPackageRoot, getPackageResource } from '@ai-brain/core'
  const templatesDir = getPackageResource('src/templates')
  ```
- **No UI code** — this package is pure logic. No React, no DOM, no terminal UI primitives (`chalk`/`ora` are only used in graphify subprocess output).
- **Subpath exports** — new public modules must be added to both `src/index.ts` barrel AND `package.json` exports.
- **Templates in `_bundled/` are tool-owned** — never modify them in user-facing code. `_custom/` is user-owned.

## Testing

```bash
bun run test:core                  # all tests
bun run test:core:unit:ci          # unit with coverage
bun run test:core:integration:ci   # integration with coverage
bun vitest run packages/core/tests/unit/config/state.test.ts  # single file
```

Test structure mirrors `src/`:
```
tests/
  unit/             # mirrors src/ structure
  integration/      # mirrors src/ structure
  helpers.ts        # createBrainWithConfig(), cleanupBrain()
```

Key test patterns:
```typescript
import { createBrainWithConfig, cleanupBrain } from '../helpers'

test('resolves brain', async () => {
  const { brainPath, configDir } = await createBrainWithConfig({ gitSync: true })
  try {
    const brain = await resolveBrain(brainPath)
    expect(brain.path).toBe(brainPath)
  } finally {
    await cleanupBrain(configDir)
  }
})
```

- Mock `execa` for git/graphify subprocess tests
- Integration tests exercise real filesystem operations

## Adding a New Platform

1. Create `src/platforms/<name>.ts` — use `claude.ts` as reference:
   ```typescript
   import { patchJsonConfig, installSkillFile } from './shared'

   export const myPlatform = {
     name: 'my-tool',
     async detect() { return fs.existsSync(configPath) },
     async patch(brainPath: string) { return patchJsonConfig(configPath, brainPath) },
     async installSkill(brainPath: string) { return installSkillFile(skillPath, brainPath) },
   }
   ```
2. Register in the `platforms` array in `src/platforms/index.ts`
3. Add platform-specific helpers to `shared.ts` if needed
4. Add tests in `tests/unit/platforms/` and `tests/integration/platforms/`
5. Update CLI commands and app RPC types if the platform needs new config options

## Common Gotchas

- **`chalk` and `ora` are dev deps** — they work at runtime because the CLI bundles them. In core, only use them inside `graphify.ts` subprocess output handling. Don't import them elsewhere.
- **Brain path resolution** — `resolveBrain()` accepts either a path or a brain ID. Always use it instead of constructing paths manually.
- **Config dir is `~/.ai-brain-tool/`** — never hardcode this; use the config module's `getConfigDir()`.
- **Platform skill content lives in `brain-skills.md`** — it's copied into the dist bundle at build time.