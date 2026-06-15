# MMA — Implementation Guidelines (Frontend)

This document is the “agent contract” for building the **MMA (Mortuary Management Application)** frontend using:

- Laravel + Inertia.js v3 + React
- Tailwind CSS v4
- Shadcn UI components (Radix + class-variance-authority)
- Existing project conventions already present in `resources/js/` and `resources/css/app.css`

The goal is an interface that is **reverent, calm, highly legible, and operationally efficient** for high-stakes administrative work.

---

## 1) Global UI & Styling Rules

### 1.1 Use Shadcn UI Components for Structure
- Prefer Shadcn primitives found in `resources/js/components/ui/*` (e.g., `Button`, `Card`, `Badge`, `Checkbox`, `Alert`, etc.).
- Avoid building ad-hoc UI with raw Tailwind for “standard” controls when a Shadcn component exists.

### 1.2 Use Tailwind tokens already defined by Shadcn
- Primary surfaces and text should use Shadcn’s semantic Tailwind classes:
  - `bg-background`, `text-foreground`
  - `bg-card`, `text-card-foreground`
  - `border-border`, `bg-secondary`, etc.
- Do not introduce new hard-coded palette values in React components unless absolutely required. Centralize visual identity in CSS variables / theme.

### 1.3 “Classy Edges” Radius
- Use default Shadcn rounding (`rounded-md`, `rounded-lg`) and avoid arbitrary `rounded-[...]` values.
- Modal/popover-like UI should feel more isolated (backdrop blur when applicable via Shadcn components).

### 1.4 Typography & Spacing Discipline
- Large pages and forms should follow:
  - generous vertical rhythm
  - persistent labels (labels above inputs; never placeholder-only)
- Default to spacing scale compatible with Tailwind base (project uses an 8px unit philosophy).

---

## 2) Inertia + Page Architecture Rules

### 2.1 Pages live in `resources/js/pages`
- Each screen is an Inertia page component.
- Keep route-naming and page naming aligned with functionality:
  - `pages/deceased/*` for the deceased register
  - `pages/chambers/*` for chamber management & chamber index
  - `pages/reports/*` for reports entry points
  - `pages/transfers/*` for transfers workflow/history

### 2.2 Layout & shell
- Use the existing app layout system in `resources/js/layouts/`.
- Keep the page content within the standard container widths and consistent padding.

### 2.3 Error, Empty, Loading States (Must Use Shadcn)
For any list/table page:
- Loading: show skeleton/loading container (or an agreed Shadcn pattern used elsewhere in the repo).
- Empty: show an Alert-style “No records found” with a CTA button if appropriate.
- Error: show an Alert-style error banner.

---

## 3) RBAC UI Rules (Spatie: laravel-permission)

MMA requires Role-Based Access Control. The frontend must not assume all actions are available.

### 3.0 Backend lock requirement (authoritative server)
The frontend is **never** the source of truth. The backend must enforce permissions using:
- `spatie/laravel-permission` for authorization
- middleware / policy / Gate checks for every protected action

The frontend’s “permission-aware UI” is only UX. The backend must still reject unauthorized requests.

### 3.1 Guard strategy (backend)
- Use `spatie/laravel-permission` with a consistent guard (commonly `web`).
- All role/permission assignments and checks must use the same guard across the app.

### 3.2 Permission model (naming convention)
Use a permission naming convention that matches the MMA domain and action:
- `deceased.view`, `deceased.create`, `deceased.update`, `deceased.delete`
- `chambers.view`, `chambers.create`, `chambers.update`, `chambers.delete`
- `transfers.create` (transfer between chambers)
- `history.view` (chamber occupation history / audit timeline)
- `reports.view`, `reports.generate` (if report generation is protected separately)

Keep permission names granular enough that the UI can cleanly hide actions.

### 3.3 Action visibility (frontend)
For each page, define:
- what actions are visible in the UI (Create/Edit/Delete/Transfer/Report)
- what actions are hidden when role is insufficient

Rules:
- Never rely on “disabled button” only—ensure destructive actions are not shown.
- Permission-aware UI must also apply to:
  - route entry points
  - “Export/Generate” buttons
  - transfer submit actions
  - delete confirmations

### 3.4 Navigation consistency
- Sidebar/navigation entries should reflect permissions.
- If a page is not allowed, the UI should route to an authorization-safe state (backend still enforces).

### 3.5 Frontend “lock” implementation guidance
Implement frontend locks so the UI aligns with backend authorization:
- Prefer permission checks from backend via shared props / Inertia props:
  - pass `can` booleans or permission lists to the page
  - use them to conditionally render buttons/links
- For safety, still handle backend authorization failures:
  - show a user-friendly “Not authorized” alert
  - keep the UI in a stable state (no broken forms)

### 3.6 Seed permissions & roles (required for testing)
Seed a minimal role set to validate UI + backend enforcement quickly.

Suggested roles:
- `Admin` (full access)
- `MortuaryStaff` (CRUD on deceased + transfers)
- `ChamberOfficer` (chambers CRUD + chamber indicator/history view)
- `Auditor` (history + reports view, no destructive operations)

Suggested permission assignment strategy:
- Start from smallest permission units and compose roles by area.
- Ensure every destructive permission is absent for non-authorized roles so UI hiding and backend blocking are both observable.

---

## 4) RBAC + Activity Auditing (Spatie Tracker) UI Rules

MMA requires auditable operations. Use Spatie activity logging (Spatie tracker) to record who did what, when, and on which domain entities.

### 4.0 Backend audit requirement (authoritative server)
- Activity logging must occur server-side for every critical operation:
  - deceased create/update/delete (and/or status changes)
  - chamber create/update/delete
  - transfers between chambers
  - any report generation action (at minimum: “generated” event)
  - chamber occupancy changes derived from transfers/releases

### 4.1 What to log (minimum metadata)
For each activity event, log:
- actor (authenticated user)
- event type/action (e.g., `deceased.updated`, `transfer.created`)
- subject model type + id (deceased/chamber/transfer)
- relevant identifiers:
  - for transfers: `from_chamber_id`, `to_chamber_id`, `deceased_id`
  - for chamber history: chamber id and related transfer id (if exists)
- timestamp is handled by the package, but ensure ordering is consistent for the UI

### 4.2 Frontend consumption rules (audit trail)
- “Chamber occupation history” UI must be a reliable audit view:
  - event ordering must match backend ordering (newest-first or oldest-first, but consistent)
  - event items show:
    - event type badge/chip
    - clear context (from → to, deceased reference, chamber reference)
    - operator/actor when available

### 4.3 UI status for audit
- Audit/history pages should never “guess”.
- If activity data is missing, show an empty state (and never silently hide the module).

---

## 6) Deceased Register (CRUD) UI Rules

### 4.1 Form patterns
- Each deceased record includes:
  - deceased info (required baseline fields)
  - relative information (relative that brought the deceased)
- Forms should use:
  - persistent labels above inputs
  - clear section grouping using Cards
  - inline field-level errors with existing Shadcn patterns (likely `InputError` equivalent in repo)

### 4.2 Table/List patterns
- Use tables with:
  - sticky headers
  - zebra striping (extremely low contrast)
  - compact but readable row height
- Provide an “actions” column with permission-aware buttons.

### 4.3 Status chips
- Deceased should display state using a `Badge`-like chip component.
- Status chips:
  - semi-bold
  - subdued background at ~10% opacity of the status color (use semantic classes)

---

## 7) Chambers CRUD + Chamber Indicator Index

### 5.1 Chambers CRUD
- Provide Create/Edit/Delete for chambers.
- Validation errors must be shown inline.
- Destructive actions should require confirmation using existing dialog patterns (if present in repo).

### 5.2 Chamber indicator index
- This index shows chamber occupancy summary.
- Each chamber row/card should include:
  - current occupation status (empty/in use)
  - days in chamber (derived)
  - quick CTA to view history or move record

### 5.3 Days-in-chamber rule (UI)
- Display “days spent in chamber” consistently:
  - If backend provides a computed value, use it directly.
  - If UI computes, ensure time zone and rounding are consistent.
- Use “humanized” display (e.g., `Today`, `1 day`, `3 days`) only if it exists as a shared helper; otherwise show integer days.

---

## 8) Chamber Occupation History (Audit-Friendly)

### 6.1 History must be chronological
- Show entries in newest-first or oldest-first depending on existing conventions; but always chronological.
- Include at least:
  - from chamber → to chamber (if transfer occurred)
  - timestamps
  - deceased reference and operator reference if available

### 6.2 Visual hierarchy
- Use cards or a timeline-like structure.
- Each entry should use:
  - badges/chips for event type (Entered, Transferred, Released/Completed)

---

## 9) Transfers Workflow (Chamber Movement)

### 7.1 Transfer UX pattern
- Transfer is a high-impact action, so:
  - confirm intent
  - require the target chamber selection
  - record the event in history immediately after completion

### 7.2 UI constraints
- Prevent invalid transitions in UI where possible:
  - cannot transfer to a non-existent chamber (server still enforces)
  - cannot transfer an already-released record if status indicates so

### 7.3 Integrate with History
- After a successful transfer, redirect to:
  - chamber history entry or
  - deceased record details (whichever aligns with your current routing convention)

---

## 10) Reports Generation Link (Entry Point)

### 8.1 UI
- A reports section exists as a link/action.
- Provide a minimal UI:
  - choose report type
  - choose date range if needed
  - show a “generate” action

### 8.2 Loading/Download behavior
- If reports generate a file, ensure user feedback:
  - “Generating report…” state
  - success toast / download initiation
  - error alert

---

## 11) Component & Naming Conventions

### 9.1 React component naming
- Use PascalCase for components.
- Keep component files small; prefer composition.

### 9.2 Avoid “magic strings”
- Centralize route names and action labels as needed.
- Use helpers already present in repo under `resources/js/lib/` and `resources/js/hooks/`.

### 9.3 Use existing utilities
- For class names, use `cn` from `@/lib/utils`.
- For navigation links, prefer named routes + `route()` helpers where used in the codebase.

---

## 12) Definition of Done (Frontend)

A feature is “Done” only when:
- UI is permission-aware (RBAC)
- all CRUD actions have complete success & error states
- table/list pages have consistent empty/error/loading behavior
- transfer actions update history UI after completion
- reports entry point is present and functional end-to-end (or clearly stubbed with a disabled state if backend is not ready)
