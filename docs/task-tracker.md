# MMA — Task Tracker (Frontend)

This tracker is for the agent to implement the **MMA (Mortuary Management Application)** UI in a reliable order with clear Definition of Done (DoD).

Legend:
- [ ] Not started
- [~] In progress
- [x] Done

---

## Phase 0 — Foundation (Pages, layout, UI patterns)
- [~] Create/align Inertia page structure:
  - [ ] Deceased register module (list + create + edit + details)
  - [ ] Chambers module (index + create/edit + delete)
  - [ ] Chamber indicator dashboard
  - [ ] Chamber occupation history
  - [ ] Transfers (move from one chamber to another)
  - [ ] Reports generation entry point
- [x] Ensure all pages use the app’s existing layout/shell consistently (from `resources/js/layouts/*`).
- [x] Implement shared UI patterns across the app:
  - [x] Loading state
  - [x] Empty state
  - [x] Error state
  - [x] Consistent card/form/table structure

**DoD**
- Pages render without runtime errors.
- Each page shows correct UI for at least one “loaded” and one “empty/error” scenario.

---

## Phase 1 — RBAC (Permission-aware UI)
- [~] Navigation/menu items reflect permissions.
- [x] Action buttons per page reflect permissions (not just disabled—hidden where required).
- [ ] Verify the UI never exposes restricted destructive operations (where role disallows).

**DoD**
- For each role scenario:
  - restricted actions are not shown
  - allowed actions are visible and functional
  - the UI remains consistent and usable

---

## Phase 2 — Deceased Register (CRUD)
- [~] Deceased listing:
  - [ ] Table with sticky headers + zebra striping
  - [ ] Actions column (permission-aware)
- [~] Deceased create:
  - [ ] Form sections (deceased info + relative info)
  - [ ] Validation errors displayed inline
- [~] Deceased edit:
  - [ ] Pre-filled form + update flow
- [ ] Deceased details:
  - [ ] Show deceased info
  - [ ] Link to related chamber history / current occupancy (if available)

**DoD**
- CRUD works end-to-end with success + error feedback.
- Table/form UX is consistent with MMA guidelines.

---

## Phase 3 — Chambers (CRUD + Chamber indicator index)
- [ ] Chambers listing:
  - [ ] Table/card layout that supports quick occupancy reading
  - [ ] Actions column (permission-aware)
- [ ] Chambers create/edit:
  - [ ] Validation + confirmation patterns for destructive operations
- [ ] Chambers delete:
  - [ ] Confirmation UX is present
  - [ ] Error feedback is shown if delete is blocked server-side
- [ ] Chamber indicator index:
  - [ ] Show chamber occupancy state per chamber
  - [ ] Show “days in chamber” (computed or provided by backend)
  - [ ] Provide CTA to view history

**DoD**
- Chambers CRUD works fully.
- Chamber indicator displays correct derived “days in chamber” per chamber.

---

## Phase 4 — Chamber Occupation History (Audit-friendly)
- [ ] History timeline/list UI for a chamber (or for a deceased record, per routing convention)
- [ ] Each history entry includes:
  - [ ] Date/time
  - [ ] Event type (entered/transfer/released/etc.)
  - [ ] Related chamber(s) (from → to) for transfers
- [ ] Uses consistent badges/chips for event types/status

**DoD**
- History is chronological and visually scannable.
- Events for transfers appear correctly.

---

## Phase 5 — Transfers (Move between chambers + update history)
- [ ] Transfers UI entry:
  - [ ] Select deceased
  - [ ] Select target chamber
- [ ] Confirm transfer:
  - [ ] Confirmation modal/dialog
- [ ] After transfer completion:
  - [ ] Redirect or update UI to reflect new occupancy
  - [ ] Ensure history reflects the new event

**DoD**
- Transfer is permission-aware and auditable in history.
- UI prevents obvious invalid states (server remains source of truth).

---

## Phase 6 — Reports Generation link (Entry point)
- [ ] Reports landing/entry UI:
  - [ ] Choose report type
  - [ ] Choose required filters/date range (if applicable)
  - [ ] Generate action
- [ ] User feedback:
  - [ ] Generating/loading state
  - [ ] Success feedback / download initiation
  - [ ] Error alert/empty guidance

**DoD**
- Reports entry point exists and behaves correctly with backend responses
  - (or shows a controlled disabled/stub UX if backend is not ready)

---

## Phase 7 — Polishing (Quality, consistency, accessibility)
- [ ] Verify consistent spacing & “classy edges” usage across pages
- [ ] Ensure form labels are persistent and readable
- [ ] Ensure keyboard/navigation support through Shadcn/Radix components
- [ ] Final pass on empty/loading/error UX

**DoD**
- App feels cohesive: consistent UI language across all MMA modules.
