# @ai-brain/ui

React component library for ai-brain-tool desktop app.

## What This Package Does

Reusable React components built on Radix UI primitives + shadcn/ui patterns, "Neural Localist" dark-first design system, theme management hook, `cn()` utility, and global CSS with design tokens.

## Installation

```bash
# From monorepo root
bun install
```

This package is private and not published to npm. It is used internally by `@ai-brain/app`.

## Usage

```typescript
import { Button, Card, Input, useTheme, cn } from '@ai-brain/ui'
import '@ai-brain/ui/styles/globals.css'
```

## Components

### UI Primitives

- `Button` - Button component with variants
- `Card` - Card container
- `Input` - Text input
- `Dialog` - Modal dialog
- `Tooltip` - Tooltip component
- `DropdownMenu` - Dropdown menu
- `Checkbox` - Checkbox component
- `Progress` - Progress bar
- `Separator` - Visual separator
- `Label` - Form label

### Utilities

- `cn()` - Class name merger
- `useTheme()` - Theme management hook

## Design System

Full spec: [docs/DESIGN.md](../../docs/DESIGN.md)

Key principles:
- **Theme:** "Neural Localist" — deep navy backgrounds, purple primary, blue secondary
- **Dark mode** is the default; light mode via `[data-theme="light"]`
- **Design tokens** use Tailwind v4 `@theme {}` syntax
- **Prefer rem over px** for all sizing and spacing
- **Buttons** are `0.5rem` rounded
- **Cards** are `0.75rem` rounded with `1px solid var(--border)`

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and [AGENTS.md](AGENTS.md) for AI assistant instructions.

```bash
# From monorepo root
bun install
```

### Adding shadcn/ui Components

```bash
cd packages/ui
npx shadcn@latest add <component-name>
```

## License

MIT - See [LICENSE](../../LICENSE) for details.
