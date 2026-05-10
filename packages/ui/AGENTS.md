# @ai-brain/ui

Private package — shared React component library using shadcn/ui + Tailwind CSS v4. Provides design system and UI primitives for the desktop app.

## What This Package Does

Reusable React components built on Radix UI primitives + shadcn/ui patterns, "Neural Localist" dark-first design system, theme management hook, `cn()` utility, and global CSS with design tokens.

## Exports

```typescript
import { Button, Card, Input, useTheme, cn } from '@ai-brain/ui'
import '@ai-brain/ui/styles/globals.css'
```

Component directory: `src/components/ui/` (shadcn/ui) and `src/components/` (custom).

## Design System

Full spec: **`docs/DESIGN.md`** — read it before creating or modifying components.

Key principles:
- **Theme:** "Neural Localist" — deep navy backgrounds, purple primary, blue secondary
- **Dark mode** is the default; light mode via `[data-theme="light"]`
- **Design tokens** use Tailwind v4 `@theme {}` syntax (not `tailwind.config.js`) — definitions live in `src/styles/globals.css`
- **Prefer rem over px** — use `rem` units for all spacing, sizing, and layout. Avoid raw pixel values unless the design spec explicitly calls for them and rem isn't practical.
- **Buttons are `0.5rem` rounded, NOT pill-shaped** — Notion-inspired geometry
- **Cards are `0.75rem` rounded** with `1px solid var(--border)`
- **Touch targets minimum `3rem`** for all interactive elements
- **Component utility classes** in globals.css: `.btn-primary`, `.card-rounded`, `.wizard-card`, `.checkbox`, `.tool-item`, `.extra-item`, `.summary-item`, `.glass`, `.technical-log`

## Rules

- **Always use `cn()` for conditional class merging** — never concatenate or template-literal class strings:
  ```typescript
  import { cn } from '@ai-brain/ui'

  <div className={cn('rounded-md bg-card', isActive && 'ring-2 ring-primary')} />
  ```
- **No business logic** — components are presentation-only. All logic lives in `@ai-brain/core`
- **Theme tokens are in `globals.css`** — don't hardcode colors; use CSS custom properties
- **Barrel export everything** — new components must be added to `src/index.ts`
- **shadcn/ui components go in `src/components/ui/`** — custom components go in `src/components/` (e.g., `icons.tsx`, `path-input.tsx`)
- **`next-themes` is installed but not active** — currently using custom `useTheme` hook. May migrate later.
- **Path alias:** `@/` maps to `src/`

## Adding shadcn/ui Components

```bash
cd packages/ui
npx shadcn@latest add <component-name>
```

Components land in `src/components/ui/`. After adding, update the barrel export in `src/index.ts`.

## Common Gotchas

- **Tailwind v4 uses `@theme {}` syntax** — don't look for `tailwind.config.js`; it doesn't exist. All tokens are in `src/styles/globals.css`.
- **`next-themes` is a dependency** but the app uses a custom `useTheme` hook. Don't import `useTheme` from `next-themes` — import from `@ai-brain/ui`.
- **No tests exist yet** — this package is UI-only with no test runner configured.
- **shadcn/ui components use Radix primitives** — don't replace them with native HTML elements; the accessibility and keyboard handling comes from Radix.
- **When adding a component, run `cd packages/ui && npx shadcn@latest add <name>`** — don't copy-paste from the shadcn website manually, as the project config (`components.json`) controls aliases and styling.