# Plan: Fix storage tier math and day-counter continuity

Two deviations from intended behavior, both confirmed in code:

## Bug 1 — Tier charge mis-anchored to day 1 when billing only uncovered days

`ServicePrice::calculateStorageCharge(int $days)` (app/Models/ServicePrice.php:61-81)
walks tiers from the tier structure's day 1. It is only correct when the argument
is the **total** days-in-storage. But `CreateStorageFeeInvoice` (app/Actions/
CreateStorageFeeInvoice.php:49) calls it with the **delta**
`$newDaysToBill = days_in_storage - lastCoveredDay`. Uncovered days are therefore
always billed at the cheapest tier.

Example: tiers 1-5 @ 10,000 / 6-10 @ 15,000 / 11+ @ 20,000; body on day 8, last
covered day 5, delta 3.
- Buggy: `calculateStorageCharge(3)` → 3 × 10,000 = **30,000** (tier-1 rate).
- Correct: days 6-8 are in tier 2 → 3 × 15,000 = **45,000**.

Root cause: the tier boundaries are absolute day ranges, but the function has no
way to know the charge is for a *sub-range* of days.

### Gap sub-bug
If a tier has `end_day=5` and the next has `start_day=7`, day 6 belongs to no tier
and is silently unbilled (contributes 0). Decision (user): **gap days bill at the
preceding tier's rate**.

## Bug 2 — Day counter does not restart on re-entry after release

`Deceased::getDaysInStorageAttribute()` (app/Models/Deceased.php:227-243) anchors
to the **first `Entered` transfer ever** and never resets. Requirements (user):

- **Chamber-to-chamber transfer (`Transferred`)**: counter must **continue** from
  the original entry — do NOT restart at day 1. (Current behavior already does this
  correctly; a `Transferred` event does not touch the counter. Must be preserved.)
- **Release then re-entry**: counter must **restart** at the new entry. The
  released gap must NOT be billed. Current behavior bills the whole span from the
  original entry — wrong.

Design decision (user): a release ends the current storage period; a fresh
`Entered` after a `Released` starts a new day-1. The effective "entry" anchor is
therefore the **most recent `Entered` that has not been followed by a `Released`
before the measurement end** — i.e. the start of the *current* continuous
admission.

## Fix approach

### 1. `ServicePrice` — add a range-aware tier charge
Introduce a second method that bills a specific day range, so the total charge for
any uncovered slice is exact:

- Keep `calculateStorageCharge(int $days)` for display/legacy total-days use, but
  fix its gap handling: when tiers have gaps, a gap day bills at the **preceding**
  tier's rate (carry the last seen tier forward).
- Add `calculateStorageChargeForRange(int $fromDay, int $toDay): float` that sums
  the charge for days `[fromDay, toDay]` using absolute tier boundaries, applying
  the same gap-carry rule.

The invoice engine then bills the **range** (lastCoveredDay+1 … daysInStorage)
instead of reusing a day-1-anchored total.

### 2. `CreateStorageFeeInvoice` — bill the actual uncovered range
- Compute `$charge = $servicePrice->calculateStorageChargeForRange($lastCoveredDay + 1, $daysInStorage)`.
- Keep `quantity` = number of uncovered days (still `$newDaysToBill`) for the line
  item; `unit_price` becomes a blended per-day rate = `$charge / $newDaysToBill`
  (or 0 when no days), so `unit_price × quantity ≈ total_price` stays internally
  consistent. Row math: `total_price = $charge`.
- This automatically makes `RecordPayment::maybeAutoGenerateNextStorageInvoice`
  (app/Actions/RecordPayment.php:70-87) and `ApplyWalletToInvoice`
  (app/Actions/ApplyWalletToInvoice.php:110-127) correct, since both funnel through
  `CreateStorageFeeInvoice::handle` with the same `lastCoveredDay`.

### 3. `Deceased::getDaysInStorageAttribute` — anchor to current admission
Replace the "first Entered ever" anchor with the start of the **current
continuous admission**:
- Find the most recent `Released` transfer for this deceased (by `transferred_at`).
- If none → anchor = the earliest `Entered` (unchanged for the never-released case).
- If a `Released` exists → anchor = the earliest `Entered` **after** that
  `Released`'s `transferred_at`. If there is no `Entered` after release (body not
  re-entered), the body is not currently in storage → return 0 (or the 0 the
  already-released end-date branch already yields).
- End date: `Released` → `released_at`; otherwise `now()` (unchanged).

`Transferred` events continue to have no effect on the counter (preserves
requirement 1). `days_paid` (Deceased.php:249-309) is a cumulative sum of
StorageFeeLog `days_billed`; no change needed there — it already continues across
transfers and reflects each billed range.

### 4. Data-entry guard (recommended, optional)
Add validation so consecutive tiers are contiguous in the service-prices form
(Store/UpdateServicePriceRequest): reject a tier whose `start_day` is greater than
the previous tier's `end_day + 1` (open-ended end_day treated as unbounded). This
prevents future gaps at the source. The gap-carry billing in step 1 remains as a
defensive fallback for pre-existing data.

### 5. Tests (Pest)
Add to `tests/Feature/StorageFeeInvoiceTest.php`:
- **Delta billing lands in the correct tier**: tiers 1-5@10000, 6-10@15000, 11+@20000;
  deceased in 8 days; first invoice covers days 1-5 (lastCoveredDay 5); second
  generation must bill days 6-8 at tier-2 rate → total 45,000 (not 30,000).
- **Gap carries preceding tier rate**: tiers day1-5@10000, day7+@20000 (day 6
  missing); a 7-day stay bills day 6 at the tier-1 rate (10,000), not 0.
- **Re-entry after release restarts the counter**: enter day 1, release on day 10,
  re-enter on day 12 → `days_in_storage` reflects the new admission (≈ the gap is
  not billed), and `day 1` of the new admission bills at the first tier.
- **Chamber transfer does not restart the counter**: enter, then `Transferred` to a
  new chamber after 4 days, still in storage on day 8 → `days_in_storage` = 8
  (unchanged by the transfer), and tier billing for the uncovered slice uses the
  true absolute day range.
- **Auto-generate path**: pay the first storage invoice to full; verify
  `RecordPayment`'s auto-generation bills the next uncovered range at the correct
  tier (regression guard for the funnel fix in step 2).

Update any existing tier tests whose expectations encoded the old day-1-anchored
behavior for *uncovered* ranges (existing "calculates tiered storage fees
correctly" test at BillingAndPaymentsTest.php:144-186 asserts on **total** days,
so it stays valid after the gap fix; re-run to confirm).

## Verification
- `php artisan test --compact` (full suite green; 2 pre-existing skips acceptable).
- `vendor/bin/pint --dirty --format agent`.
- For the frontend: no change to tier display math is required; the
  `tiered_price`/`has_tiers` props are display-only and unaffected. Rebuild is not
  needed unless `availableServices` mapping changes (it does not in this plan).

## Files touched
- app/Models/ServicePrice.php (gap-carry + range method)
- app/Actions/CreateStorageFeeInvoice.php (bill the uncovered range)
- app/Models/Deceased.php (re-entry-aware days_in_storage anchor)
- app/Http/Requests/StoreServicePriceRequest.php + UpdateServicePriceRequest.php
  (optional contiguity guard)
- tests/Feature/StorageFeeInvoiceTest.php (new cases)

Out of scope: `RecordPayment`/`ApplyWalletToInvoice` call sites need no change
(they already pass `lastCoveredDay` to the shared action); `days_paid` logic is
left as-is.
