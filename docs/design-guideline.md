# MMA — Serene Oversight Design Guideline (Frontend)

This document is the **visual + component behavior guide** for building the MMA (Mortuary Management Application) UI using:

- Tailwind CSS v4 (semantic tokens from `resources/css/app.css`)
- Shadcn UI (Radix + class-variance-authority)
- React (Inertia pages in `resources/js/pages`)
- Existing UI conventions already present in the repo (`resources/js/components/ui/*`)

Purpose: reduce cognitive load for users handling time-sensitive and high-stakes tasks—while keeping the interface dignified, modern corporate, and calm.

---

## 1) Brand Personality & UX Tone

**Personality**
- Reverent
- Steadfast
- Impeccably organized

**Design intent**
- Minimalism with “architectural” whitespace
- Clear hierarchy and high legibility
- Subtle depth through tonal layering (avoid heavy shadows)
- Interactive emphasis via luminosity shifts, not harsh color changes

---

## 2) Color System (Serene Oversight)

The app should behave as a semantic design system (use Shadcn’s semantic Tailwind classes first).

Use these anchors (from your palette) conceptually:

- Primary anchor: **Dark Blue-Grey** `#2C3E50` (dominant for headers + primary actions)
- Secondary anchor: **Slate Blue** `#34495E` (supporting UI structure / outlines)
- Tertiary/Accent: **Deep Emerald** `#1E3A34` (sparingly)
- Neutral background: **Off-White** `#F8F9FA`
- Error: muted burgundy `#ba1a1a` (avoid bright red intensity)

### Practical Shadcn rule
Prefer tokens like:
- `bg-primary`, `text-primary-foreground`
- `border-input`, `bg-background`, `text-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-destructive`, `text-white` for errors

Avoid hardcoding hex colors directly in React unless the token mapping is not available.

---

## 3) Typography & Readability

Font: **Inter** (Use Inter across all typography including Headline, Body, and Label text).

Hierarchy intent:
- Headlines (Inter): semibold/medium with tighter letter spacing
- Body (Inter): comfortable for long records
- Labels (Inter): semibold, persistent, and never placeholder-only

### Form label rule
- Labels live above inputs (`label` element + Shadcn input)
- Keep label font small-to-medium but semibold for scanning

---

## 4) Layout & Spacing

**Grid**
- Fixed-fluid hybrid mental model:
  - 12 columns
  - max width: 1440px
  - wide gutters: 24px

**Whitespace philosophy**
- Large “frame” margins: 48px page margin
- Vertical rhythm: base 8px unit

### Container rule
- Each major section should live inside standard layout padding / container widths used by the existing app shell.

---

## 5) Elevation & Depth (Neat + Dignified)

Avoid heavy shadows.
- Level 0: background (neutral off-white)
- Level 1: cards/containers use 1px border + very soft shadow
- Level 2: modal/popover feel isolated (subtle stronger shadow + optional blur)

**Implementation rule**
- Use Shadcn `Card` / `Dialog` / `Popover` instead of custom shadow recipes.

---

## 6) “Classy Edges” Shape Strategy

Rounded corners:
- Controls: ~8px–12px feeling (map to Shadcn `rounded-md` / `rounded-lg`)
- Avoid random corner radii in components.
- Keep consistent border radius across:
  - buttons
  - inputs
  - cards
  - badges/chips

---

## 7) Component Behavior Guidelines (Shadcn-first)

### 7.1 Buttons
- Primary: Dark Blue-Grey (`#2C3E50`) / “strong action” emphasis
- Secondary: quiet fill (`#34495E`)
- Inverted: dark background with light text
- Outlined: clear background with border
- Hover: subtle luminosity shift, not an aggressive hue change
- Destructive: only for confirmed operations

Shadcn usage:
- `variant="default"` for primary
- `variant="secondary"` for secondary actions
- `variant="outline"` for outlined buttons
- `variant="destructive"` for destructive only

### 7.2 Input Fields
- 1px border; on focus border slightly intensifies (Shadcn handles this)
- Labels above fields
- Keep consistent form spacing and section grouping via `Card`

### 7.3 Cards
- Cards are primary containers for case files and records
- Use:
  - 1px border
  - generous internal padding
- Card header should visually separate from body:
  - subtle background fill (use Shadcn patterns; if none exist, use a muted secondary background token)

### 7.4 Data Tables
Tables are essential in MMA.

Rules:
- sticky headers (if possible in chosen table component strategy)
- zebra striping with extremely low-contrast greys
- compact but readable row height
- headers use `label-sm` intent

### 7.5 Status Chips / Badges
Use chip-like `Badge` for:
- Deceased state (Pending / In Progress / Completed etc.)
- Chamber occupancy status
- Transfer events types

Rules:
- semibold text
- background at ~10% opacity (achieved via semantic “secondary with opacity” patterns)
- do not overpower data

---

## 8) Feature-specific Visual Rules

### 8.1 Deceased Register
- Separate sections clearly:
  - Deceased identity
  - Relative / bringer information
- Actions in a dedicated actions column
- Status chips appear in list views for scanability

### 8.2 Chambers
- Chamber indicator index must be scannable:
  - show chamber occupancy
  - show days-in-chamber
  - show quick path to history or transfer

### 8.3 Occupation History & Transfers
- History must read like an audit log:
  - chronological order
  - event type badges
  - transfer event shows from → to clearly
- Transfer confirmation is modal/dialog with calm destructive emphasis rules.

### 8.4 Reports
- Reports entry is minimal:
  - report type
  - filters (if any)
  - generate action
- Provide loading state + success/error feedback.

---

## 9) Accessibility & Operational Clarity

- Keyboard navigable via Radix/Shadcn defaults
- High contrast semantic tokens for primary actions and text
- Avoid relying on color alone:
  - pair status chips with labels/text
- Confirmation before destructive actions
- Clear error copy; no technical stack traces in UI.

---

## 10) “Do Not” List (Guardrails)

- Do not hardcode arbitrary hex colors in UI components.
- Do not invent new button/input patterns when Shadcn exists.
- Do not create inconsistent rounding or spacing across pages.
- Do not use placeholder-only labels in forms.

---

## 11) Files & Where to Look

- Shadcn components: `resources/js/components/ui/*`
- Utility `cn`: `resources/js/lib/utils.ts`
- Inertia pages: `resources/js/pages/*`
- App shell/layout: `resources/js/layouts/*`
- Tailwind theme tokens: `resources/css/app.css`

