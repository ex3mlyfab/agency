# MMA — Interface Design System

**Project:** Mortuary Management Application  
**Direction:** Vibrant Oversight — operational, high-contrast, and premium with a bold-but-harmonious saturated palette. Every non-auth screen sits on the same solid semantic canvas; component color is reserved for meaning and navigational cues.

---

## Direction & Feel

- **Who:** Mortuary facility staff managing intake, chamber allocation, and release workflows
- **Verb:** Track occupancy, register deceased, move chambers, audit history
- **Feel:** A confident control room — strong visual hierarchy, crisp contrast, saturated accents used strategically, generous whitespace, and clearly defined interactive states. Readability and accessibility (WCAG AA) come first; color adds a premium feel, never visual noise.

---

## Depth Strategy

**Border-driven elevation.** No default shadows on cards or the app content shell. Cards use `bg-card rounded-lg border-border` on the solid `bg-background` canvas. Hover elevation uses border intensify (`hover:border-primary/40`) not shadow. Only dropdowns/popovers/drawers get real shadows.

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

### Sidebar
- Same solid surface as the canvas via `--sidebar: var(--background)` in both themes
- Active item: `bg-sidebar-accent` with `font-semibold` and `text-sidebar-accent-foreground`
- Navigation icons use restrained semantic cues: mint for chambers, plum for transfers, apricot for history, blue for reports
- Group labels remain muted; color is reserved for active navigation and semantic states

### Page canvas and complementary component colors
- Non-auth pages use `bg-background` as a solid canvas in both sidebar and header layouts; avoid gradients and unrelated page-level fills.
- Cards and intentional inset panels use `bg-card`; controls use their existing control tokens.
- Use semantic accent tokens (`primary`, `success`, `warning`, `info`, `highlight`, `accent`) for component cues, not as competing page backgrounds.
- Keep each accent consistent with its meaning across pages; use low-opacity token tints for supporting surfaces and solid tokens for icons, labels, and important statuses.
- Auth pages intentionally retain their independent layouts and are excluded from the solid-canvas normalization.

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
| `--background` | `#edf3f8` | `#0b1420` | Solid app canvas |
| `--primary` | `#4f46c7` | `#8b93ff` | Primary action, hero text |
| `--secondary` | `#e3eaf2` | `#1c3042` | Quiet controls and secondary actions |
| `--success` | `#16745b` | `#42c99f` | Occupied, released, positive |
| `--warning` | `#b85c0a` | `#f2aa45` | Pending, attention-required |
| `--info` | `#315bc7` | `#6d92ff` | Reports, trend data, informational actions |
| `--highlight` | `#7652c8` | `#b19aff` | Transfers, secondary focal panels |
| `--accent` | `#087f8c` | `#35c7d0` | Complementary accent surfaces |
| `--muted` | `#e8f0f6` | `#193043` | Disabled, tracks, subtle fills |
| `--muted-foreground` | `#475569` | `#94a3b8` | Labels, meta text |
| `--border` | `#c6d5e1` | `#294158` | All borders |
| `--ring` | `#4f46c7` | `#8b93ff` | Focus rings |
| `--destructive` | `#dc2626` | `#ef4444` | Errors, delete |
| `--chart-2` | `oklch(0.62 0.16 190)` | `oklch(0.78 0.16 190)` | Chart lines (admissions) |

All accent tokens pair with a near-white (`#ffffff`) foreground in light mode and a deep-ink
(`#0b1120` / `#ffffff`) foreground in dark mode to keep foreground/background contrast at WCAG AA or
better. Buttons, chips, and status pills use solid, high-contrast fills rather than low-opacity tints.

---

## Do Not

- Hardcode hex colors in React components (use semantic tokens)
- Use raw `text-blue-*`, `text-emerald-*`, `text-amber-*`, or `text-slate-*` classes for product states
- Use gradients for dashboard cards; use a subtle semantic tint and edge accent instead
- Use `bg-secondary/30` on card headers — border is enough
- Use `hover:shadow-md` on cards — border intensify instead
- Mix `rounded-xl` and `rounded-lg` — standardize on `rounded-lg` for cards
- Use `font-extrabold` — use `font-bold` consistently
- Use `py-3` and `py-4` inconsistently — card headers are `py-3`, content is `py-6`
