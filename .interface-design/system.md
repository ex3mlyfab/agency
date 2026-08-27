# MMA — Interface Design System

**Project:** Mortuary Management Application  
**Direction:** Serene Oversight — reverent, operational, architecturally calm

---

## Direction & Feel

- **Who:** Mortuary facility staff managing intake, chamber allocation, and release workflows
- **Verb:** Track occupancy, register deceased, move chambers, audit history
- **Feel:** Dignified control room — like a hospital operations floor at 3am. Quiet, precise, no visual noise.

---

## Depth Strategy

**Border-driven elevation.** No default shadows on cards. Cards use `rounded-lg` + `border-border`. Hover elevation uses border intensify (`hover:border-primary/40`) not shadow. Only dropdowns/popovers/drawers get real shadows.

- Level 0: `bg-background` (canvas)
- Level 1: `border-border` (cards, panels)
- Level 2: `shadow-sm` (modals, dialogs only — via Shadcn defaults)

---

## Spacing

- **Base unit:** 4px
- **Page margin:** `p-6` (24px)
- **Section gaps:** `gap-4` or `space-y-6`
- **Card internal padding:** `px-6 py-6` for content, `px-6 py-3` for headers
- **Item gaps in lists:** `gap-3`
- **Form field gaps:** `space-y-1.5` (6px)

---

## Hierarchy Decisions

### Type Scale (Inter, ratio ~1.25)

| Role | Size | Weight | Color | Tracking |
|------|------|--------|-------|----------|
| Display (hero numbers) | 3xl (24px) | bold | primary | tight |
| H1 (page titles) | xl (20px) | semibold | foreground | tight |
| H2 (card titles) | base (16px) | semibold | foreground | normal |
| Label (section headers) | xs (12px) | semibold | muted-foreground | wide |
| Body | sm (14px) | regular | foreground | normal |
| Caption (meta) | xs (12px) | regular | muted-foreground | normal |

### Density

Workbench-tight. 36px row height in tables (`py-2.5`). Card headers are compact (`py-3`). Metric cards use 24px hero numbers with 12px tracked labels above.

---

## Key Component Patterns

### Card
- `rounded-lg border` (no default shadow)
- Header: `border-b border-border px-6 py-3` with `text-xs font-semibold tracking-wide uppercase text-muted-foreground`
- Content: `px-6 py-6`
- No `bg-secondary/30` on headers — border alone is the separator

### Table
- Rows: `py-2.5 px-4` (compact)
- Headers: `text-xs font-semibold tracking-wide text-muted-foreground`
- Zebra striping via `.mma-zebra` utility (extremely low contrast)
- Sticky headers via Shadcn Table component
- Tabular nums via `body { font-variant-numeric: tabular-nums }`

### Status Chip (mma-chip)
- `font-semibold text-xs` with ~10% opacity background
- Colors: `mma-chip-pending`, `mma-chip-in-chamber`, `mma-chip-released`, `mma-chip-entered`, `mma-chip-transferred`, `mma-chip-completed`
- Defined in `app.css` under `@layer utilities`

### Button
- Primary: `variant="default"` → `bg-primary text-primary-foreground`
- Destructive: `variant="destructive"` only for confirmed destructive ops
- Release action uses `bg-success text-white` (semantic, not hardcoded emerald)
- No `hover:shadow-md` on any card or button group

### Chart
- Lines use CSS token references: `var(--chart-2)` for admissions, `var(--success)` for releases
- Dots use `stroke="var(--background)"` (not hardcoded white) for proper dark mode

---

## Palette Tokens (from app.css)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--background` | `#f8f9fa` | `oklch(0.145 0 0)` | Canvas |
| `--primary` | `#2c3e50` | `oklch(0.985 0 0)` | Primary action, hero text |
| `--secondary` | `#34495e` | `oklch(0.269 0.02 210)` | Section fills (rare) |
| `--success` | `oklch(0.6 0.15 160)` | `oklch(0.5 0.12 160)` | Occupied, released, positive |
| `--muted` | `#e2e8f0` | `oklch(0.269 0.02 210)` | Disabled, tracks, subtle fills |
| `--muted-foreground` | `#64748b` | `oklch(0.708 0 0)` | Labels, meta text |
| `--border` | `oklch(0.83 0.01 210)` | `oklch(0.269 0.02 210)` | All borders |
| `--ring` | `oklch(0.55 0.05 243)` | `oklch(0.55 0.05 243)` | Focus rings |
| `--destructive` | `oklch(0.47 0.19 27)` | `oklch(0.396 0.141 25.723)` | Errors, delete |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `oklch(0.696 0.17 162.48)` | Chart lines (admissions) |

---

## Do Not

- Hardcode hex colors in React components (use semantic tokens)
- Use `bg-secondary/30` on card headers — border is enough
- Use `hover:shadow-md` on cards — border intensify instead
- Mix `rounded-xl` and `rounded-lg` — standardize on `rounded-lg` for cards
- Use `font-extrabold` — use `font-bold` consistently
- Use `py-3` and `py-4` inconsistently — card headers are `py-3`, content is `py-6`
