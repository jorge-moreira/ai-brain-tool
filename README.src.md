<!--@nrg.languages=en,es-->
<!--@nrg.defaultLanguage=en-->
<div align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/jorge-moreira/ai-brain-tool/main/docs/logo.svg" height="150" alt="ai-brain-tool"/></a>
  
  <h3>Your personal AI memory, connected to all your AI tools</h3><!--en-->
  <h3>Tu memoria de IA personal, conectada a todas tus herramientas de IA</h3><!--es-->
  <br>

[![Test](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/test.yml/badge.svg)](https://github.com/jorge-moreira/ai-brain-tool/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/jorge-moreira/ai-brain-tool/graph/badge.svg)](https://codecov.io/gh/jorge-moreira/ai-brain-tool)
[![npm version](https://img.shields.io/npm/v/%40jorge-moreira.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreira.dev/ai-brain-tool)
[![npm downloads](https://img.shields.io/npm/dm/%40jorge-moreira.dev%2Fai-brain-tool)](https://www.npmjs.com/package/@jorge-moreira.dev/ai-brain-tool)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/jorge-moreira)

[English](README.md) · [Español](README.es.md)

*Powered by* **[graphify](https://github.com/safishamsi/graphify)**<!--en-->
*Desarrollado con* **[graphify](https://github.com/safishamsi/graphify)**<!--es-->

<a href="https://graphifylabs.ai"><img src="https://raw.githubusercontent.com/safishamsi/graphify/v4/docs/logo-text.svg" width="260" height="64" alt="Graphify"/></a>

> The knowledge graph engine that turns folders of notes,  code, papers, and media into a queryable graph your AI tools can traverse.<!--en-->
> El motor de grafos de conocimiento que convierte carpetas de notas, código, artículos y multimedia en un grafo consultable que tus herramientas de IA pueden recorrer.<!--es-->

[Install](#install) · [Quick Start](#quick-start) · [Multiple Brains](#multiple-brains) · [Commands](#commands) · [Template Ownership](#template-ownership) · [Inside AI Tools](#inside-ai-tools) · [New Machine Setup](#new-machine-setup) · [Options](#options) · [Credits](#credits)<!--en-->
[Instalación](#instalación) · [Inicio rápido](#inicio-rápido) · [Múltiples cerebros](#múltiples-cerebros) · [Comandos](#comandos) · [Propiedad de plantillas](#propiedad-de-plantillas) · [Dentro de las herramientas de IA](#dentro-de-las-herramientas-de-ia) · [Configuración en una máquina nueva](#configuración-en-una-máquina-nueva) · [Opciones](#opciones) · [Créditos](#créditos)<!--es-->

</div>

---

## Install<!--en-->
## Instalación<!--es-->

To install the tool globally:<!--en-->
Para instalar la herramienta de forma global:<!--es-->

```bash
npm install -g @jorge-moreira.dev/ai-brain-tool
```

Then use anywhere:<!--en-->
Después úsala desde cualquier lugar:<!--es-->

```bash
ai-brain <command>
```

> [!NOTE]
> You can also opt to use the tool portable using:<!--en-->
> También puedes usar la herramienta de forma portable con:<!--es-->
> ```bash
> npx @jorge-moreira.dev/ai-brain-tool <command>
> ```

---

## Quick start<!--en-->
## Inicio rápido<!--es-->

Run the interactive wizard: creates your brain folder, installs graphify, configures every detected AI tool (Claude Code, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, OpenAI Codex CLI), and optionally sets up Obsidian.<!--en-->
Ejecuta el asistente interactivo: crea la carpeta de tu cerebro, instala graphify, configura todas las herramientas de IA detectadas (Claude Code, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, OpenAI Codex CLI) y opcionalmente configura Obsidian.<!--es-->

```bash
npx @jorge-moreira.dev/ai-brain-tool setup
ai-brain setup
```

---

## Multiple brains<!--en-->
## Múltiples cerebros<!--es-->

The tool supports multiple brains. Brains configurations are stored in `~/.ai-brain-tool/config.json`.<!--en-->
La herramienta soporta múltiples cerebros. Las configuraciones de cada cerebro se guardan en `~/.ai-brain-tool/config.json`.<!--es-->

### Brain identifier<!--en-->
### Identificador del cerebro<!--es-->

Every brain has a short identifier (e.g., `work`, `personal`) that identifies it. Use `--brain-id <id>` to target a specific brain:<!--en-->
Cada cerebro tiene un identificador corto (por ejemplo, `work`, `personal`) que lo distingue. Usa `--brain-id <id>` para apuntar a un cerebro específico:<!--es-->

```bash
ai-brain <command> personal
ai-brain <command> --brain-id personal
```

> [!NOTE]
> If you're in a brain folder (or a subfolder), commands automatically detect which brain to use — no need to specify the identifier.<!--en-->
> Si estás dentro de la carpeta de un cerebro (o de una subcarpeta), los comandos detectan automáticamente cuál usar — no hace falta indicar el identificador.<!--es-->

### List brains<!--en-->
### Listar cerebros<!--es-->

```bash
ai-brain list
```

Shows all registered brains with their identifiers and paths.<!--en-->
Muestra todos los cerebros registrados con sus identificadores y rutas.<!--es-->

---

## Commands<!--en-->
## Comandos<!--es-->

### `ai-brain setup`

Run the interactive setup wizard.<!--en-->
Ejecuta el asistente interactivo de configuración.<!--es-->

- **Fresh machine:** full wizard — creates the brain folder, initialises git, installs graphify, configures AI tools, sets up Obsidian, prompts for brain identifier (defaults to folder name).<!--en-->
- **Inside an existing brain folder** (e.g. after `git clone`): new-machine mode — only recreates `.venv`, patches local AI tool configs, prompts for brain identifier (defaults to folder name).<!--en-->
- **Máquina nueva:** asistente completo — crea la carpeta del cerebro, inicializa git, instala graphify, configura las herramientas de IA, prepara Obsidian y pregunta por el identificador del cerebro (por defecto el nombre de la carpeta).<!--es-->
- **Dentro de una carpeta de cerebro existente** (por ejemplo, tras un `git clone`): modo «máquina nueva» — solo recrea `.venv`, parchea las configuraciones locales de las herramientas de IA y pregunta por el identificador del cerebro (por defecto el nombre de la carpeta).<!--es-->

What the wizard configures per selected AI tool:<!--en-->
Lo que el asistente configura para cada herramienta de IA seleccionada:<!--es-->
- MCP server entry pointing to the brain's `graph.json`<!--en-->
- `/brain` skill installed globally in the tool<!--en-->
- Always-on context file written into the brain folder (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules/ai-brain.mdc`, or `.github/copilot-instructions.md`)<!--en-->
- Entrada de servidor MCP apuntando al `graph.json` del cerebro<!--es-->
- Skill `/brain` instalado de forma global en la herramienta<!--es-->
- Archivo de contexto «always-on» escrito en la carpeta del cerebro (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules/ai-brain.mdc` o `.github/copilot-instructions.md`)<!--es-->

Git options asked during setup:<!--en-->
Opciones de Git que se preguntan durante la configuración:<!--es-->
- Git repository or local folder only<!--en-->
- Optional remote URL<!--en-->
- Whether to commit the extraction cache (saves tokens on new machines)<!--en-->
- **Auto-sync** — whether `/brain update` should commit and push automatically after each graph rebuild<!--en-->
- Repositorio Git o solo carpeta local<!--es-->
- URL remota opcional<!--es-->
- Si se debe versionar la caché de extracción (ahorra tokens en máquinas nuevas)<!--es-->
- **Auto-sync** — si `/brain update` debe hacer commit y push automáticamente tras cada reconstrucción del grafo<!--es-->

```bash
ai-brain setup
```

---

### `ai-brain update`

Rebuild the knowledge graph from `raw/` using graphify. If auto-sync was enabled during setup, commits and pushes after the rebuild.<!--en-->
Reconstruye el grafo de conocimiento desde `raw/` usando graphify. Si se activó el auto-sync durante la configuración, hace commit y push tras la reconstrucción.<!--es-->

```bash
ai-brain update                   # Used if already on the brain folder
ai-brain update --brain-id work   # Specify brain by identifier
```

> [!NOTE]
> Inside any AI tool, `/brain update` loads the graphify skill which rebuilds the graph using AI subagents for semantic extraction. If auto-sync was enabled during setup, the skill automatically commits and pushes after the rebuild.<!--en-->
> Dentro de cualquier herramienta de IA, `/brain update` carga el skill de graphify, que reconstruye el grafo usando subagentes de IA para la extracción semántica. Si el auto-sync estaba activado, el skill hace commit y push automáticamente tras la reconstrucción.<!--es-->

---

### `ai-brain status`

Show brain health: tool version, graphify version, graph node/edge count, brain path.<!--en-->
Muestra la salud del cerebro: versión de la herramienta, versión de graphify, número de nodos/aristas del grafo y ruta del cerebro.<!--es-->

```bash
ai-brain status         # Used if already on the brain folder
ai-brain status work    # Specify brain by identifier
```

Equivalent inside any AI tool: `status`<!--en-->
Equivalente dentro de cualquier herramienta de IA: `status`<!--es-->

---

### `ai-brain templates list`

List all templates — both tool-managed (`_bundled/`) and yours (`_custom/`).<!--en-->
Lista todas las plantillas — tanto las gestionadas por la herramienta (`_bundled/`) como las tuyas (`_custom/`).<!--es-->

```bash
ai-brain templates list
ai-brain templates list work    # Specify brain by identifier
```

---

### `ai-brain templates add`

Create a new custom template from a minimal starter file. Places the file in `raw/templates/markdown/_custom/` or `raw/templates/web-clipper/_custom/`. Files in `_custom/` are never touched by upgrades.<!--en-->
Crea una nueva plantilla personalizada a partir de un archivo de inicio mínimo. La coloca en `raw/templates/markdown/_custom/` o `raw/templates/web-clipper/_custom/`. Los archivos en `_custom/` nunca se ven afectados por las actualizaciones.<!--es-->

```bash
ai-brain templates add
ai-brain templates add work    # Specify brain by identifier
```

---

### `ai-brain upgrade`

Upgrade graphify in `.venv/` and refresh all bundled templates in `_bundled/`. Your custom templates in `_custom/` are never touched.<!--en-->
Actualiza graphify en `.venv/` y refresca todas las plantillas integradas en `_bundled/`. Tus plantillas personalizadas en `_custom/` nunca se modifican.<!--es-->

```bash
ai-brain upgrade        # Used if already on the brain folder
ai-brain upgrade work   # Specify brain by identifier
```

---

### `ai-brain list`

List all registered brains with their identifiers and paths.<!--en-->
Lista todos los cerebros registrados con sus identificadores y rutas.<!--es-->

```bash
ai-brain list
```

---

### `ai-brain setup-obsidian`

Setup or update Obsidian vault configuration for a brain.<!--en-->
Configura o actualiza la configuración del vault de Obsidian para un cerebro.<!--es-->

```bash
ai-brain setup-obsidian
ai-brain setup-obsidian --update
```

---

## Template ownership<!--en-->
## Propiedad de plantillas<!--es-->

```
raw/templates/
├── markdown/
│   ├── _bundled/    ← tool-owned, rewritten on upgrade
│   └── _custom/     ← yours, never touched by the tool
└── web-clipper/
    ├── _bundled/    ← tool-owned, rewritten on upgrade
    └── _custom/     ← yours, never touched by the tool
```

---

## Inside AI tools<!--en-->
## Dentro de las herramientas de IA<!--es-->

After setup, a `/brain` skill is installed in each configured AI tool. Commands run from inside the brain folder manage the brain; query commands work from any project.<!--en-->
Tras la configuración, se instala un skill `/brain` en cada herramienta de IA configurada. Los comandos lanzados desde dentro de la carpeta del cerebro gestionan ese cerebro; los comandos de consulta funcionan desde cualquier proyecto.<!--es-->

```
/brain update              — rebuild graph from raw/ (+ auto-sync if enabled)
/brain add <url>           — fetch a URL and add it to raw/
/brain templates           — list available templates
/brain wiki                — generate agent-crawlable wiki (graphify-out/wiki/)
/brain obsidian            — generate Obsidian vault export
/brain query "<question>"  — query the knowledge graph via MCP
/brain path "<A>" "<B>"    — find shortest path between two concepts via MCP
/brain status              — show graph stats and tool version
```

---

## New machine setup<!--en-->
## Configuración en una máquina nueva<!--es-->

After cloning your brain repo on a new machine:<!--en-->
Tras clonar el repositorio de tu cerebro en una máquina nueva:<!--es-->

```bash
cd your-brain
ai-brain setup
```

The tool detects the existing brain, skips scaffolding, and only recreates `.venv` and patches your local AI tool configs.<!--en-->
La herramienta detecta el cerebro existente, omite el scaffolding y solo recrea `.venv` y parchea las configuraciones locales de tus herramientas de IA.<!--es-->

---

## Options<!--en-->
## Opciones<!--es-->

```
--help, -h      Show help for any command
--version, -v   Show the current tool version
```

---

## Contributing<!--en-->
## Cómo contribuir<!--es-->

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, testing, and contribution guidelines.<!--en-->
Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para las instrucciones de configuración, pruebas y pautas de contribución.<!--es-->

---

## Credits<!--en-->
## Créditos<!--es-->

**ai-brain-tool** is a facade over **[graphify](https://github.com/safishamsi/graphify)** by [@safishamsi](https://github.com/safishamsi). All graph extraction, clustering, wiki generation, Obsidian export, and MCP serving is done by graphify. This tool adds the setup wizard, platform integrations, and `/brain` skill layer on top.<!--en-->
**ai-brain-tool** es una fachada sobre **[graphify](https://github.com/safishamsi/graphify)** de [@safishamsi](https://github.com/safishamsi). Toda la extracción del grafo, el clustering, la generación de wikis, la exportación a Obsidian y el servidor MCP los hace graphify. Esta herramienta añade encima el asistente de configuración, las integraciones con cada plataforma y la capa de skill `/brain`.<!--es-->
