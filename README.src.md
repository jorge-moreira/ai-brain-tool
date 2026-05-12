<!--@nrg.languages=en,es-->
<!--@nrg.defaultLanguage=en-->
<!--@nrg.fileNamePattern.es=docs/i18n/README.es.md-->
<div align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/jorge-moreira/ai-brain-tool/main/docs/logo.svg" height="150" alt="ai-brain-tool"/></a>
  
  <h3>Your personal AI memory, connected to all your AI tools</h3><!--en-->
  <h3>Tu memoria de IA personal, conectada a todas tus herramientas de IA</h3><!--es-->
  <br>

[![CI](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jorge-moreira/ai-brain-tool/graph/badge.svg)](https://codecov.io/gh/jorge-moreira/ai-brain-tool)
[![npm version](https://img.shields.io/npm/v/%40jorge-moreira.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreira.dev/ai-brain-tool)
[![npm downloads](https://img.shields.io/npm/dm/%40jorge-moreira.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreira.dev/ai-brain-tool)
[![GitHub Release](https://img.shields.io/github/v/release/jorge-moreira/ai-brain-tool?include_prereleases&label=release)](https://github.com/jorge-moreira/ai-brain-tool/releases)
[![License](https://img.shields.io/github/license/jorge-moreira/ai-brain-tool)](LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/jorge-moreira)

[English](README.md) · [Español](docs/i18n/README.es.md)<!--en-->
[English](../../README.md) · [Español](README.es.md)<!--es-->

*Powered by* **[graphify](https://github.com/safishamsi/graphify)**<!--en-->
*Desarrollado con* **[graphify](https://github.com/safishamsi/graphify)**<!--es-->

<a href="https://graphifylabs.ai"><img src="https://raw.githubusercontent.com/safishamsi/graphify/v4/docs/logo-text.svg" width="260" height="64" alt="Graphify"/></a>

> The knowledge graph engine that turns folders of notes, code, papers, and media into a queryable graph your AI tools can traverse.<!--en-->
> El motor de grafos de conocimiento que convierte carpetas de notas, código, artículos y multimedia en un grafo consultable que tus herramientas de IA pueden recorrer.<!--es-->

[Quick Start](#quick-start) · [Architecture](#architecture) · [Packages](#packages) · [Contributing](#contributing) · [License](#license) · [Credits](#credits)<!--en-->
[Inicio rápido](#inicio-rápido) · [Arquitectura](#arquitectura) · [Paquetes](#paquetes) · [Contribución](#contribución) · [Licencia](#licencia) · [Créditos](#créditos)<!--es-->

</div>

---

## Quick Start<!--en-->
## Inicio rápido<!--es-->

### Option 1: Desktop App (Recommended)<!--en-->
### Opción 1: Aplicación de escritorio (Recomendado)<!--es-->

Download for your platform:<!--en-->
Descarga para tu plataforma:<!--es-->

| Platform    | Download                                                                         |
| ----------- | -------------------------------------------------------------------------------- |
| **macOS**   | [Download .dmg](https://github.com/jorge-moreira/ai-brain-tool/releases/latest)  |
| **Windows** | [Download .zip](https://github.com/jorge-moreira/ai-brain-tool/releases/latest)  |
| **Linux**   | [Download .tar.gz](https://github.com/jorge-moreira/ai-brain-tool/releases/latest) |

### Option 2: CLI<!--en-->
### Opción 2: CLI<!--es-->

```bash
# Install globally
npm install -g @jorge-moreira.dev/ai-brain-tool

# Or use without installing
npx @jorge-moreira.dev/ai-brain-tool setup
```

### Setup Wizard<!--en-->
### Asistente de configuración<!--es-->

Both the app and CLI will guide you through:<!--en-->
Tanto la app como la CLI te guiarán a través de:<!--es-->

1. Creating your brain folder
2. Installing graphify
3. Configuring AI tools (Claude Code, OpenCode, Cursor, Gemini CLI, Copilot CLI, Codex CLI)
4. Optional: Obsidian integration

---

## Architecture<!--en-->
## Arquitectura<!--es-->

```mermaid
flowchart TB
    subgraph "User Interfaces"
        DESKTOP[Desktop App<br/>ElectroBun + React]
        CLI[CLI Tool<br/>Node.js + Commander]
        AI[AI Tools<br/>Claude, Cursor, etc.]
    end
    
    subgraph "Core (@ai-brain/core)"
        CONFIG[Config Management]
        GRAPHIFY[Graphify Integration]
        PLATFORMS[Platform Integrations<br/>6 AI Tools]
        SCAFFOLD[Brain Scaffolding]
        GIT[Git Sync]
        MCP[MCP Server]
    end
    
    subgraph "Storage"
        BRAIN[Brain Folder<br/>graph.json + raw/]
        VENV[.venv<br/>graphify]
    end
    
    DESKTOP -->|RPC| CONFIG
    CLI --> CONFIG
    AI -->|MCP| MCP
    
    CONFIG --> BRAIN
    GRAPHIFY --> VENV
    PLATFORMS --> AI
    SCAFFOLD --> BRAIN
    GIT --> BRAIN
    MCP --> GRAPHIFY
    
    style DESKTOP fill:#8b5cf6,color:#fff
    style CLI fill:#8b5cf6,color:#fff
    style AI fill:#8b5cf6,color:#fff
    style CONFIG fill:#3b82f6,color:#fff
    style GRAPHIFY fill:#3b82f6,color:#fff
    style PLATFORMS fill:#3b82f6,color:#fff
    style SCAFFOLD fill:#3b82f6,color:#fff
    style GIT fill:#3b82f6,color:#fff
    style MCP fill:#3b82f6,color:#fff
    style BRAIN fill:#10b981,color:#fff
    style VENV fill:#10b981,color:#fff
```

### Components<!--en-->
### Componentes<!--es-->

| Component       | Purpose                                                       |
| --------------- | ------------------------------------------------------------- |
| **Desktop App** | Native GUI for brain management (ElectroBun + React)          |
| **CLI**         | Command-line interface for terminal users                     |
| **Core**        | Shared business logic (config, graphify, platforms, git, MCP) |
| **AI Tools**    | Integrations with Claude Code, Cursor, Gemini, etc.           |
| **Brain**       | Your knowledge graph stored in `graph.json`                   |
| **Graphify**    | Python engine for graph extraction and clustering             |

---

## Packages<!--en-->
## Paquetes<!--es-->

This monorepo contains 4 packages:<!--en-->
Este monorepo contiene 4 paquetes:<!--es-->

| Package                              | Description                                                     | Published                                                                   |
| ------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **@ai-brain/core**                   | Business logic: config, graphify, platforms, scaffold, git, MCP | No                                                                          |
| **@jorge-moreira.dev/ai-brain-tool** | CLI tool (`ai-brain` command)                                   | Yes — [npm](https://www.npmjs.com/package/@jorge-moreira.dev/ai-brain-tool) |
| **@ai-brain/app**                    | ElectroBun desktop app (macOS, Windows, Linux)                  | No — GitHub Releases                                                        |
| **@ai-brain/ui**                     | React component library (shadcn/ui + Tailwind v4)               | No                                                                          |

**Dependency graph:** `cli → core`, `app → core + ui`, `ui` (standalone).<!--en-->
**Grafo de dependencias:** `cli → core`, `app → core + ui`, `ui` (independiente).<!--es-->

```mermaid
graph LR
    CLI["@jorge-moreira.dev/ai-brain-tool<br/>(CLI)"]
    APP["@ai-brain/app<br/>(Desktop)"]
    CORE["@ai-brain/core<br/>(Business Logic)"]
    UI["@ai-brain/ui<br/>(Components)"]
    
    CLI --> CORE
    APP --> CORE
    APP --> UI
    
    style CLI fill:#8b5cf6,color:#fff
    style APP fill:#8b5cf6,color:#fff
    style CORE fill:#3b82f6,color:#fff
    style UI fill:#10b981,color:#fff
```

See each package's README for details:<!--en-->
Consulta el README de cada paquete para más detalles:<!--es-->

- [packages/core/README.md](packages/core/README.md)
- [packages/cli/README.md](packages/cli/README.md)
- [packages/app/README.md](packages/app/README.md)
- [packages/ui/README.md](packages/ui/README.md)

---

## Contributing<!--en-->
## Contribución<!--es-->

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, testing, and contribution guidelines.<!--en-->
Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para las instrucciones de configuración, pruebas y pautas de contribución.<!--es-->

---

## Credits<!--en-->
## Créditos<!--es-->

**ai-brain-tool** is a facade over **[graphify](https://github.com/safishamsi/graphify)** by [@safishamsi](https://github.com/safishamsi). All graph extraction, clustering, wiki generation, Obsidian export, and MCP serving is done by graphify. This tool adds the setup wizard, platform integrations, and `/brain` skill layer on top.<!--en-->
**ai-brain-tool** es una fachada sobre **[graphify](https://github.com/safishamsi/graphify)** de [@safishamsi](https://github.com/safishamsi). Toda la extracción del grafo, el clustering, la generación de wikis, la exportación a Obsidian y el servidor MCP los hace graphify. Esta herramienta añade encima el asistente de configuración, las integraciones con cada plataforma y la capa de skill `/brain`.<!--es-->

---

## License<!--en-->
## Licencia<!--es-->

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.<!--en-->
Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.<!--es-->
