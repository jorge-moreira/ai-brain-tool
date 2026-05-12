# @ai-brain/app (Desktop App)

Private package — ElectroBun desktop application for macOS. Depends on `@ai-brain/core` for all business logic and `@ai-brain/ui` for components.

## What This Package Does

Native desktop app wrapping the setup wizard and brain dashboard. Uses ElectroBun (Bun process + WebView) with typed RPC communication between backend and frontend.

## Architecture

```
Bun Process (src/bun/index.ts)
  - Window lifecycle, app menu
  - RPC handlers for filesystem/AI ops
  - Uses @ai-brain/core for all logic
          │
          │ typed RPC (src/shared/rpc-types.ts)
          │
WebView (src/mainview/)
  - React app (Vite + HMR)
  - Uses @ai-brain/ui components
  - rpc.ts client proxy for bun requests
```

Window sizes: **Wizard** 600×650, **Dashboard** 1200×800.

Design spec: **`docs/DESIGN.md`** — defines all layout, color palette, typography, spacing, and component specs. Read it before creating or modifying screens. **Prefer rem over px** for all sizing and spacing.

## Key Directories

```
src/bun/index.ts          — Main process: BrowserWindow, RPC handlers, app menu
src/shared/rpc-types.ts   — Typed RPC request/response definitions (25+ handlers)
src/mainview/
  App.tsx                  — Root: routes between Wizard, Dashboard, Settings
  components/
    atoms/                 — Primitive UI pieces (14 files)
    molecules/             — Composite components (8 files)
    organisms/             — Complex composed components (6 files)
  screens/
    dashboard/             — BrainsDashboard, EmptyDashboard
    installation-wizard/   — 6-step wizard flow
  lib/rpc.ts               — Typed RPC client proxy
  views/                   — Dashboard.tsx, Settings.tsx, Wizard.tsx
```

## Commands

```bash
bun run app:dev       # Start dev server with HMR (concurrently: vite + electrobun)
bun run app:build     # Production build (vite build + electrobun build)
```

## Path Aliases

```
@ai-brain/core          → ../core/src/index.ts
@ai-brain/ui             → ../ui/src/index.ts
@/components/*           → ./src/mainview/components/* + ../ui/src/components/*
@/views/*                → ./src/mainview/views/*
@/screens/*              → ./src/mainview/screens/*
@/lib/*                  → ./src/mainview/lib/* + ../ui/src/lib/*
@/types/*                → ./src/mainview/types/*
@/shared/*               → ./src/shared/*
```

## Rules

- **Atomic design** — components organized as atoms → molecules → organisms. Put primitives in `atoms/`, composed pieces in `molecules/`, complex UI in `organisms/`.
- **All logic in `@ai-brain/core`** — the app package only handles UI and RPC bridging. No filesystem access, no subprocess calls in WebView code.
- **RPC is the only IPC** — never access the filesystem or run subprocesses from the WebView. Always go through RPC:
  ```typescript
  // In WebView code:
  const result = await rpc.request('installGraphify', { brainPath })
  // In src/bun/index.ts handler:
  { request: 'installGraphify', handler: async ({ brainPath }) => installGraphify(brainPath) }
  ```
- **Use `@ai-brain/ui` components** — don't duplicate UI primitives in the app package. Import from the shared library.
- **Path aliases** — use `@/` for internal imports, `@ai-brain/core` and `@ai-brain/ui` for workspace dependencies.

## Adding a New RPC Method

1. Add request/response types in `src/shared/rpc-types.ts`
2. Add handler in `src/bun/index.ts`
3. The client proxy in `src/mainview/lib/rpc.ts` auto-generates from types

## Build Details

`electrobun.config.ts` copies core resources into the build:
- `core/package.json`, `core/requirements.txt`, `core/src/templates/`, `core/src/platforms/brain-skills.md`
- `dist/index.html` → `views/mainview/index.html`
- `dist/assets` → `views/mainview/assets`

If you add a new resource in core that the app needs at runtime, update `electrobun.config.ts` copy rules.

## Common Gotchas

- **No tests yet** — this package has no test framework configured. CI workflow exists (`app-test.yml`) but is not yet wired into `ci.yml`.
- **Window sizes are hardcoded** — Wizard (600×650) and Dashboard (1200×800) are defined in `src/bun/index.ts`. Don't add arbitrary sizes.
- **`electrobun.d.ts`** — type declarations for ElectroBun globals. Don't modify unless upgrading ElectroBun.
- **HMR vs production** — `bun run app:dev` runs Vite + ElectroBun concurrently. Changes to `src/bun/` require a restart; changes to `src/mainview/` hot-reload.
- **The app copies core into the build** — if you reference a new core resource at runtime, you must add it to `electrobun.config.ts` copy rules, or it won't be available in the built app.