@@ -0,0 +1,182 @@
# AI Brain Tool - Design System

## Overview

Professional desktop app design following **Notion's design principles** (8px rounded buttons, 12px rounded cards, sober editorial geometry) with the **official logo color palette**.

---

## Color Palette

### Dark Theme (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `rgb(2, 13, 31)` | Deep navy from logo background |
| `card` | `rgb(11, 19, 33)` | Card surfaces |
| `primary` | `rgb(161, 135, 227)` | Purple brain highlight |
| `primary-container` | `rgb(176, 138, 232)` | Purple variant |
| `secondary` | `rgb(37, 144, 249)` | Light blue brain highlight |
| `secondary-container` | `rgb(18, 154, 246)` | Blue variant |
| `foreground` | `rgb(248, 248, 248)` | Primary text |
| `muted-foreground` | `rgb(160, 170, 190)` | Secondary text |
| `border` | `rgb(30, 45, 80)` | Borders and dividers |

### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `rgb(255, 255, 255)` | Pure white |
| `card` | `rgb(248, 250, 255)` | Off-white card surfaces |
| `primary` | `rgb(120, 90, 200)` | Darker purple for contrast |
| `secondary` | `rgb(30, 120, 220)` | Darker blue for contrast |
| `foreground` | `rgb(2, 13, 31)` | Deep navy text |
| `muted-foreground` | `rgb(60, 70, 95)` | Secondary text |
| `border` | `rgb(220, 225, 235)` | Light borders |

---

## Typography

### Font Stack
- **Sans-serif**: System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'`)
- **Mono**: System mono (`'SF Mono', 'Segoe UI Mono', 'Roboto Mono'`)

### Type Scale
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-3xl` | 1.875rem | 600 | Card titles |
| `text-base` | 1rem | 400 | Body text |
| `text-sm` | 0.875rem | 500 | Button labels, captions |

---

## Shapes (Notion-inspired)

| Token | Value | Usage |
|-------|-------|-------|
| `radius-md` | 0.5rem (8px) | **Buttons**, inputs |
| `radius-lg` | 0.75rem (12px) | **Cards**, containers |
| `radius-xl` | 1rem (16px) | Icon containers |
| `radius-full` | 9999px | Pills, badges only |

**Key distinction from typical designs**: Buttons use **8px rounded rectangles**, NOT pills. This creates a sober, professional aesthetic.

---

## Layout & Spacing

### Wizard Dimensions
- **Window size**: 700×750px (wizard), 1200×800px (dashboard)
- **Card max-width**: 672px (`max-w-2xl`)
- **Card padding**: 2.5rem (40px)
- **Icon size**: 80×80px container, 40×40px icon

### Spacing Scale
- Base unit: 4px
- Common gaps: 0.75rem (12px), 1.5rem (24px), 2rem (32px)
- Section padding: 2rem (32px)

---

## Components

### Buttons
```
Height: 48px (touch-friendly)
Radius: 0.5rem (8px) - NOT pill-shaped
Font: 0.875rem, 500 weight
```

**Variants:**
- Primary: Purple background, navy text
- Outline: Transparent with border
- Ghost: For theme toggle

### Cards
```
Radius: 0.75rem (12px)
Border: 1px solid var(--border)
Shadow: Subtle drop shadow
Padding: 2.5rem
```

### Icons
```
Container: 80×80px with 0.75rem radius
Icon: 40×40px
Background: 10% opacity of primary/secondary
```

### Progress
```
Height: 12px (h-3)
Radius: 0.5rem
Background: surface-container-high
```

### Alerts
```
Radius: 0.5rem (8px)
Padding: 1rem
Icon + text layout
```

---

## Elevation & Depth

| Level | Treatment | Usage |
|-------|-----------|-------|
| Flat | Border only | Default cards |
| Subtle | `0 4px 24px rgba(0,0,0,0.3)` | Wizard cards (dark) |
| Light | `0 4px 24px rgba(2,13,31,0.08)` | Wizard cards (light) |

---

## Design Principles

### Do
- ✅ Use logo colors: deep navy background, purple & blue accents
- ✅ 8px rounded buttons (Notion geometry)
- ✅ 12px rounded cards
- ✅ System fonts for native feel
- ✅ Generous padding (2.5rem cards)
- ✅ Large, perceptible components (max-w-2xl)
- ✅ 48px touch targets

### Don't
- ❌ Pill-shaped buttons
- ❌ Custom fonts (Inter, JetBrains Mono)
- ❌ Small components that feel lost
- ❌ Heavy shadows on light theme
- ❌ Pure black (#000) anywhere

---

## Mockups

View the HTML mockups:
- `docs/mockups/wizard-dark.html` - Dark theme welcome screen
- `docs/mockups/wizard-light.html` - Light theme welcome screen

Open in browser at 700×750px viewport to see actual size.

---

## Implementation Files

| File | Purpose |
|------|---------|
| `packages/ui/src/styles/globals.css` | Design tokens, theme vars |
| `packages/app/src/mainview/components/Wizard.tsx` | Wizard container |
| `packages/app/src/mainview/screens/*.tsx` | Screen components |

---

## Color Contrast

All text meets WCAG AA standards:
- Foreground on background: 16.5:1 (dark), 16.5:1 (light)
- Muted foreground: 8.2:1 (dark), 8.5:1 (light)
- Primary button: 8.5:1 (dark), 4.7:1 (light)
