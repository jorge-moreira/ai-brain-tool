# AI Brain Desktop App - Design Specification

**Date:** 2026-04-27  
**Author:** @jorge-moreira  
**Status:** Draft

---

## Overview

Bundle the AI Brain CLI (`ai-brain`) into a cross-platform desktop application using Electron, enabling non-technical users to access all CLI features through a graphical interface while maintaining the existing npm package distribution.

---

## Goals

1. **Cross-platform support** - macOS (Intel + Apple Silicon), Windows, Linux
2. **Code reuse** - Share 100% of business logic between CLI and Desktop app
3. **Dual distribution** - Continue publishing to npm (CLI) + GitHub Releases (Desktop app binaries)
4. **Auto-updates** - Desktop app auto-updates via GitHub Releases
5. **Professional UX** - Signed + notarized macOS app, no security warnings

---

## Non-Goals

1. App Store distribution (macOS, Windows, Linux)
2. Rewriting existing CLI logic
3. Breaking changes to existing npm package API

---

## Architecture

### Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | Electron | Full Node.js API access, mature ecosystem |
| UI | React + TypeScript | Largest Electron ecosystem, type safety |
| Components | shadcn/ui | Professional UI, you own the code, Tailwind-based |
| Build Tool | Vite | Fast dev server, optimized builds |
| Bundler | electron-builder | Cross-platform builds, auto-update support, code signing |
| Auto-updater | electron-updater | GitHub Releases integration |

### Project Structure

```
ai-brain-tool/
├── package.json              ← Workspace root (private, not published)
├── bun.lockb                 ← Single lock file for all packages
├── packages/
│   ├── cli/
│   │   ├── package.json      ← Published to npm
│   │   ├── bin/
│   │   │   └── ai-brain.js   ← CLI entry point
│   │   └── src/
│   ├── electron/
│   │   ├── package.json      ← Desktop app
│   │   ├── electron-builder.config.ts
│   │   ├── vite.main.config.ts
│   │   ├── vite.renderer.config.ts
│   │   └── src/
│   └── ui/                   ← Shared React components (Electron + future Website)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── components/   ← shadcn/ui components
│           └── hooks/
├── .npmignore                ← Excludes: packages/electron, packages/ui
├── .releaserc.json           ← Modified to include Electron assets
└── .github/workflows/
    └── release.yml           ← Parallel npm + Electron release
```

**Note:** `packages/website/` is intentionally excluded from this spec. The workspace structure supports adding it later, but website implementation is out of scope for this project.

**Key Benefits:**
- Single `bun.lockb` — consistent dependencies across all packages
- `@ai-brain/ui` — shared components (Electron app, future website reuse)
- `@ai-brain/core` (inside cli/src/) — business logic shared by CLI + Electron
- Clean separation — each package has clear purpose
- Bun workspaces — no need to switch to Yarn
- Future-proof — website can be added later without restructuring

### Key Architectural Decisions

1. **Monorepo structure** - Single `package.json`, single version number
2. **Core logic isolation** - `src/core/` has no CLI or Electron dependencies
3. **IPC boundary** - Renderer process cannot import Node.js modules directly
4. **`.npmignore`** - Excludes Electron artifacts from npm package
5. **GitHub Releases** - Desktop binaries distributed separately from npm

---

## Components

### 1. Core Layer (`packages/cli/src/core/`)

**Purpose:** Shared business logic used by both CLI and Electron.

**Modules:**
- `commands/setup.ts` - Interactive setup wizard logic
- `commands/update.ts` - Knowledge graph rebuild + git sync
- `commands/status.ts` - Brain health check
- `commands/list.ts` - List configured brains
- `commands/templates/` - Template management
- `config.ts` - Configuration management
- `graphify.ts` - Graph generation logic
- `platforms/` - OS detection + platform-specific utilities

**Exports:** Pure async functions, no CLI prompts, no Electron APIs.

---

### 2. CLI Layer (`packages/cli/`)

**Purpose:** Wrap core functions as CLI commands, published to npm.

**Entry Point:** `bin/ai-brain.js` (JS wrapper that imports compiled CLI module)

**Example:**
```typescript
// src/cli/index.ts
import { status } from '../core/commands/status'
import { program } from 'commander'

program
  .command('status')
  .action(async (brainId, options) => {
    await status(brainId, options)
  })
```

---

### 3. Electron Main Process (`packages/electron/src/main/`)

**Purpose:** IPC handlers, window management, file system access.

**Responsibilities:**
- Create BrowserWindow
- Handle IPC calls from renderer
- Call core functions (imported from `@ai-brain/cli` core)
- Auto-update management
- Code signing integration

**IPC Channels:**
- `brain:status` - Get brain health
- `brain:update` - Trigger knowledge graph update
- `brain:setup` - Run setup wizard
- `brain:list` - List configured brains
- `config:get` - Get configuration
- `config:set` - Update configuration
- `app:quit` - Quit application
- `app:check-updates` - Check for app updates

---

### 4. Electron Renderer (`packages/electron/src/renderer/`)

**Purpose:** React-based UI.

**Pages:**
- `Dashboard` - Brain status overview
- `Setup` - First-time setup wizard
- `BrainsList` - Manage configured brains
- `Settings` - Configuration (Obsidian path, git settings)
- `Templates` - Template management

**Services Layer:**
Abstracts IPC calls, provides React hooks:
```typescript
// packages/electron/src/renderer/src/services/brainService.ts
export const brainService = {
  getStatus: () => ipcRenderer.invoke('brain:status'),
  update: (brainId: string) => ipcRenderer.invoke('brain:update', brainId),
}
```

---

### 5. Shared UI (`packages/ui/`)

**Purpose:** Reusable React components for Electron app + Website.

**Components:**
- shadcn/ui components (Button, Card, Dialog, Input, Toast, etc.)
- Custom components (BrainStatusCard, SetupWizard, etc.)
- Hooks (useBrainStatus, useConfig, etc.)

**Usage:**
```typescript
// In Electron app
import { Button, Card } from '@ai-brain/ui'

// In Website
import { Button, Card } from '@ai-brain/ui'
```

---

## Data Flow

```
┌─────────────────┐     IPC      ┌─────────────────┐
│   React UI      │ ───────────► │  Main Process   │
│   (Renderer)    │ ◄─────────── │  (Node.js)      │
│   @ai-brain/ui  │              │  @ai-brain/cli  │
└─────────────────┘              └────────┬────────┘
                                          │
                                          ▼
                                   ┌─────────────────┐
                                   │  Core Layer     │
                                   │  (Shared Logic) │
                                   └─────────────────┘

┌─────────────────┐
│   Website       │ ◄── NOT in scope (structure supports future addition)
│   (Future)      │
└─────────────────┘
```

---

## Error Handling

### Core Layer
- Throw typed errors (e.g., `BrainNotFoundError`, `GitSyncError`)
- No user-facing messages (handled by CLI/Electron layers)

### CLI Layer
- Catch errors, display via `console.error()` + chalk colors
- Exit with appropriate codes

### Electron Main Process
- Catch errors, send to renderer via IPC
- Log to file for debugging

### Electron Renderer
- Display errors via UI toast/notifications
- Provide retry actions where applicable

---

## Testing Strategy

| Layer | Testing Approach |
|-------|-----------------|
| Core | Unit tests (vitest) - existing tests adapted for TS |
| CLI | Integration tests (existing e2e tests) |
| Electron Main | Unit tests for IPC handlers |
| Electron Renderer | Component tests (React Testing Library) |
| End-to-End | Playwright tests for critical user flows |

---

## Build & Release

### Development

```bash
# CLI (existing)
bun run start

# Electron dev mode
bun run electron:dev
```

### Release Workflow

```
Tag Created (v2.2.0)
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌─────────────────┐
│ npm    │  │ Build Electron  │
│ Publish│  │ (mac/win/linux) │
└────────┘  └────────┬────────┘
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
         Sign +        Upload to
         Notarize      GitHub Releases
         (macOS)       + Auto-update
```

### Code Signing

| Platform | Requirement | Configuration |
|----------|-------------|---------------|
| macOS | Apple Developer Certificate + Notarization | `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_APP_SPECIFIC_PASSWORD` |
| Windows | Optional (recommended) | `CSC_LINK` (p12 file) |
| Linux | None | N/A |

---

## Auto-Update Flow

1. App starts → checks GitHub Releases for newer version
2. Update available → notify user via dialog
3. User accepts → download in background
4. Download complete → prompt restart to install
5. App relaunches → new version running

**Configuration:**
```typescript
// electron-builder.config.ts
publish: {
  provider: 'github',
  owner: 'jorge-moreira',
  repo: 'ai-brain',
  releaseType: 'release'
}
```

---

## Migration Path

### Phase 1: Workspace Setup
1. Create root `package.json` with workspaces config
2. Move existing `package.json` → `packages/cli/package.json`
3. Create `packages/ui/package.json` (shadcn/ui components)
4. Verify bun workspace commands work

### Phase 2: Core Refactoring
1. Convert `src/commands/*.js` → `packages/cli/src/core/commands/*.ts`
2. Export functions (no CLI side effects)
3. Update `bin/ai-brain.js` to import from compiled output

### Phase 3: Electron Setup
1. Create `packages/electron/package.json`
2. Add Vite + TypeScript config
3. Create main process with basic window
4. Implement IPC for one command (e.g., `status`)

### Phase 4: UI Implementation
1. Add shadcn/ui components to `packages/ui/`
2. Create React app in `packages/electron/src/renderer/`
3. Build Dashboard page (status display)
4. Implement remaining pages incrementally

### Phase 5: Build & Release
1. Configure electron-builder
2. Set up code signing in CI
3. Modify `release.yml` for parallel jobs
4. Test auto-update flow

---

## Success Criteria

1. ✅ CLI npm package continues working unchanged
2. ✅ Desktop app runs on macOS, Windows, Linux
3. ✅ Desktop app auto-updates from GitHub Releases
4. ✅ macOS app notarized (no security warnings)
5. ✅ Core logic shared (no duplication)
6. ✅ `@ai-brain/ui` shared between Electron + Website
7. ✅ Bun workspaces configured correctly
8. ✅ CI/CD automates both releases

---

## Open Questions

1. **Windows code signing** - Purchase certificate or skip for initial release?
2. **Linux distribution format** - AppImage, deb, rpm, or all three?
3. **Update notification timing** - Check on startup, or periodic background check?

---

## Appendix: Dependencies

### Workspace Root (package.json)

```json
{
  "name": "ai-brain-tool-monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

### packages/cli/package.json (Published to npm)

```json
{
  "name": "@ai-brain/cli",
  "version": "2.2.0",
  "type": "module",
  "bin": {
    "ai-brain": "./bin/ai-brain.js"
  },
  "dependencies": {
    "commander": "^14.0.3",
    "chalk": "^5.0.0",
    "@inquirer/prompts": "^8.4.2",
    "ora": "^9.4.0",
    "execa": "^9.0.0"
  }
}
```

### packages/electron/package.json

```json
{
  "name": "@ai-brain/electron",
  "version": "2.2.0",
  "private": true,
  "dependencies": {
    "@ai-brain/ui": "workspace:*",
    "electron": "^30.0.0",
    "electron-updater": "^6.0.0"
  },
  "devDependencies": {
    "electron-builder": "^24.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### packages/ui/package.json (Shared Components)

```json
{
  "name": "@ai-brain/ui",
  "version": "2.2.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-label": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.0",
    "@radix-ui/react-toast": "^1.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Note:** Workspace structure supports adding `packages/website/` in the future, but website implementation is explicitly out of scope for this project.
