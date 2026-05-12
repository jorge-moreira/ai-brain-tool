# @ai-brain/app

ElectroBun desktop application for ai-brain-tool.

## What This Package Does

Native desktop app wrapping the setup wizard and brain dashboard. Uses ElectroBun (Bun process + WebView) with typed RPC communication between backend and frontend.

## Installation

```bash
# From monorepo root
bun install
```

## Quick Start

### Download Pre-built

| Platform    | Download                                                                             |
| ----------- | ------------------------------------------------------------------------------------ |
| **macOS**   | [Download .dmg](https://github.com/jorge-moreira/ai-brain-tool/releases/latest)      |
| **Windows** | [Download .exe](https://github.com/jorge-moreira/ai-brain-tool/releases/latest)      |
| **Linux**   | [Download .AppImage](https://github.com/jorge-moreira/ai-brain-tool/releases/latest) |

### Development Mode

```bash
# From monorepo root
bun run app:dev
```

## Architecture

```mermaid
flowchart TB
    subgraph "Bun Process (Backend)"
        BUN[src/bun/index.ts<br/>Window lifecycle, RPC handlers]
        CORE["@ai-brain/core<br/>Business logic]
    end
    
    subgraph "WebView (Frontend)"
        REACT[React App<br/>Vite + HMR]
        UI["@ai-brain/ui<br/>Components]
        RPC[rpc.ts<br/>Typed RPC client]
    end
    
    BUN <-->|Typed RPC<br/>rpc-types.ts| RPC
    BUN --> CORE
    REACT --> UI
    REACT --> RPC
    
    style BUN fill:#8b5cf6,color:#fff
    style CORE fill:#3b82f6,color:#fff
    style REACT fill:#10b981,color:#fff
    style UI fill:#10b981,color:#fff
    style RPC fill:#f59e0b,color:#fff
```

### Window Sizes

- **Wizard:** 600×650
- **Dashboard:** 1200×800

## Features

- Interactive setup wizard (6-step flow)
- Brain dashboard with management UI
- Typed RPC between backend and frontend
- Built on ElectroBun (Bun + WebView)
- Uses `@ai-brain/core` for business logic
- Uses `@ai-brain/ui` for components

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and [AGENTS.md](AGENTS.md) for AI assistant instructions.

```bash
# Start dev server with HMR
bun run app:dev

# Production build
bun run app:build
```

## License

MIT - See [LICENSE](../../LICENSE) for details.
