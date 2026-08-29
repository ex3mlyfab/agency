# Implementation Plan: Invoice Payment Total + Wallet-to-Invoice Settlement

## Problem Summary

Two issues exist in the current payment workflow:

1. **Missing invoice total on payment form**: On the Deceased Show page (`/deceased/{id}`), the "Record Payment" dialog has an "Apply To" dropdown (`Invoice` / `General Account Deposit`). When an unpaid invoice is selected, the form does **not** display the total amount expected, total paid, or outstanding balance. The user has no visibility into how much the invoice is for.

2. **No wallet-to-invoice settlement mechanism**: The system supports "Hospital Wallet" (a `PaymentMode` seeded in the migration) and general-account deposits (payments with `invoice_id = null`). These general deposits create ledger credit for a deceased, but there is **no mechanism to apply that wallet/credit balance toward settling an unpaid invoice bill**.

---

## Current Architecture

### Data Model

| Table | Key Columns | Notes |
|---|---|---|
| `invoices` | `id` (ulid), `deceased_id`, `invoice_number`, `total_amount`, `paid_amount`, `status`, `notes` | Status set to `Draft` by default in migration, but `saveInvoice` in `DeceasedController` sets `Unpaid`. Status transitions: `Unpaid` → `Partially Paid` → `Paid` |
| `payments` | `id` (ulid), `deceased_id`, `invoice_id` (nullable), `amount`, `payment_method`, `payment_mode_id` | `invoice_id = null` = general deposit / wallet credit. `received_by` = user id |
| `payment_modes` | `id` (ulid), `name`, `is_active` | Seeded modes: Cash, Cheque, POS, Hospital Wallet |
| `deceased` | `id`, `first_name`, `last_name`, etc. | Has `HasOne` Invoice, `HasMany` Payments. Computed accessors: `total_billed`, `total_paid`, `ledger_balance`, `days_in_storage`, `days_paid` |

### Computed Attributes (Deceased model)

- `total_billed` = `invoice->total_amount` (0 if no invoice)
- `total_paid` = `payments()->sum('amount')` — **sums ALL payments** (general deposits + invoice payments)
- `ledger_balance` = `total_billed - total_paid` (positive = debt, negative = surplus/credit)
- `isBillSettled()` = `ledger_balance <= 0`
- `days_paid` = proportional calculation based on payment ratio vs. total billed

### Key Backend Actions

- `App\Actions\RecordPayment::handle()` — Creates a Payment, updates `invoice.paid_amount = invoice->payments()->sum('amount')`, and recalculates invoice status. Uses `DB::transaction`.
- `PaymentController::store()` — Delegates to `RecordPayment`.
- `DeceasedController::saveInvoice()` — Creates/updates invoice + invoice items with tiered pricing logic.
- `DeceasedController::show()` and `showReleaseForm()` — Loads deceased with `invoice.invoiceItems.service`, `payments.receivedByUser`, `payments.paymentMode`.

### Frontend Pages

- **`resources/js/pages/deceased/show.tsx`** — Has a "Record Payment / Deposit" dialog. The "Apply To" dropdown sets `invoice_id` to either `deceased.invoice.id` (Invoice) or `''` (General). No amount-expected summary is shown.
- **`resources/js/pages/invoices/show.tsx`** — Has a "Record Payment" dialog. Amount defaults to `balance` (outstanding). Shows "Outstanding Balance: ₦{balance}" in dialog description but no detailed invoice summary within the form.
- **`resources/js/pages/payments/index.tsx`** — Read-only listing + filtering of all payments.
- **`resources/js/pages/payments/show.tsx`** — Read-only payment receipt detail.

### Routes (`routes/web.php`)

```php
Route::resource('invoices', InvoiceController::class)->only(['index', 'show']);
Route::resource('payments', PaymentController::class)->only(['index', 'show', 'store']);
```

### Existing Tests

- `tests/Feature/BillingAndPaymentsTest.php` — Covers ledger balance computation, release blocking, invoice payments, tiered pricing. Uses Pest v4.

---

## Part 1: Show Total Amount Expected When Invoice Is Selected

### Goal

When the user selects "Invoice" in the payment form's "Apply To" dropdown, display a summary panel showing:
- **Invoice number**
- **Total Amount Expected** (invoice `total_amount`)
- **Total Paid** (invoice `paid_amount` or `payments()->sum('amount')`)
- **Outstanding Balance** (total_amount − paid_amount)

This should appear in **both** the Deceased Show payment dialog **and** the Invoice Show payment dialog.

### Changes

### 1.1 Deceased Show Page (`resources/js/pages/deceased/show.tsx`)

**A. Add a computed invoice summary** that updates when `paymentForm.data.invoice_id` changes.

The `Deceased` interface already includes `invoice?: Invoice` with `total_amount`, `paid_amount`, `status`, `invoice_number`. The payment form already tracks `invoice_id`. We need to:

- Add an `InvoiceSummary` panel (conditional) inside the payment dialog that shows when `paymentForm.data.invoice_id` is set (i.e., "Invoice" is selected).

```tsx
// Inside the Record Payment Dialog, after the "Apply To" select:

{paymentForm.data.invoice_id && deceased.invoice && (
    <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/10 p-3 text-sm">
        <div>
            <span className="text-xs text-muted-foreground block">Invoice #</span>
            <span className="font-mono text-foreground">{deceased.invoice.invoice_number}</span>
        </div>
        <div className="text-right">
            <span className="text-xs text-muted-foreground block">Total Amount Expected</span>
            <span className="font-semibold text-foreground">
                {currencySymbol}{Number(deceased.invoice.total_amount).toLocaleString()}
            </span>
        </div>
        <div>
            <span className="text-xs text-muted-foreground block">Total Paid</span>
            <span className="font-medium text-emerald-600">
                {currencySymbol}{Number(deceased.invoice.paid_amount || 0).toLocaleString()}
            </span>
        </div>
        <div className="text-right">
            <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
            <span className="font-semibold text-destructive">
                {currencySymbol}{(Number(deceased.invoice.total_amount) - Number(deceased.invoice.paid_amount || 0)).toLocaleString()}
            </span>
        </div>
    </div>
)}
```

**B.** Pre-fill the amount field when invoice is selected to the outstanding balance (if the user leaves amount blank, default to balance).

### 1.2 Invoice Show Page (`resources/js/pages/invoices/show.tsx`)

The Invoice Show page already has:
```tsx
const paymentForm = useForm({
    ...
    amount: balance.toFixed(2),
    ...
});
```

We need to add an invoice summary panel in the payment dialog showing total amount expected, total paid, and outstanding balance. The `invoice` prop already includes `total_amount`, `paid_amount`, and `status`.

```tsx
// After the DialogDescription, add a summary grid:

<div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/10 p-3 text-sm">
    <div>
        <span className="text-xs text-muted-foreground block">Total Amount Expected</span>
        <span className="font-semibold text-foreground">
            {fmtCurrency(total, symbol)}
        </span>
    </div>
    <div className="text-right">
        <span className="text-xs text-muted-foreground block">Total Paid</span>
        <span className="font-medium text-emerald-600">
            {fmtCurrency(paid, symbol)}
        </span>
    </div>
    <div className="col-span-2">
        <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
        <span className="font-semibold text-destructive text-base">
            {fmtCurrency(balance, symbol)}
        </span>
    </div>
</div>
```

---

## Part 2: Settle Invoice Bills from Wallet Payments

### Goal

Create a mechanism to apply general-deposit (wallet) payments — i.e. payments with `invoice_id = null` — toward settling an unpaid invoice bill for the same deceased.

### Design Decisions

1. **No new tables needed.** The `payments` table already supports `invoice_id` (nullable). Applying wallet funds to an invoice = re-linking (or splitting) general-deposit payments to point to the invoice.
2. **Backend action** `App\Actions\ApplyWalletToInvoice` — encapsulates the transaction:
   - Finds general-deposit payments for the deceased
   - Applies up to the requested amount (or full balance) to the invoice
   - Handles partial application by creating a new payment linked to the invoice if a single deposit exceeds the remaining balance
   - Recalculates invoice `paid_amount` and `status`
3. **New route + controller method** on `PaymentController` (or `InvoiceController`): `POST /payments/apply-wallet-to-invoice`
4. **Frontend**: A new section or button in the Deceased Show payment dialog and/or a dedicated UI element showing available wallet balance and an "Apply Wallet to Invoice" action.

### 2.1 Backend Changes

#### A. New Action: `app/Actions/ApplyWalletToInvoice.php`

```php
<?php

namespace App\Actions;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApplyWalletToInvoice
{
    /**
     * @param array<string, mixed> $data  {invoice_id, deceased_id, amount?}
     * @param string $appliedBy
     * @return Payment|null  Returns the new/updated payment, or null if nothing applied
     */
    public function handle(array $data, string $appliedBy): ?Payment
    {
        return DB::transaction(function () use ($data, $appliedBy): ?Payment {
            $invoice = Invoice::lockForUpdate()->findOrFail($data['invoice_id']);

            // Validate invoice belongs to the deceased
            if ($invoice->deceased_id !== $data['deceased_id']) {
                abort(422, 'The selected invoice does not belong to the deceased record.');
            }

            // Compute outstanding balance
            $balance = $invoice->total_amount - $invoice->paid_amount;
            if ($balance <= 0) {
                return null;
            }

            // Get available wallet deposits (invoice_id = null, ordered by oldest)
            $walletDeposits = Payment::where('deceased_id', $data['deceased_id'])
                ->whereNull('invoice_id')
                ->lockForUpdate()
                ->orderBy('payment_date')
                ->orderBy('created_at')
                ->get();

            $walletTotal = $walletDeposits->sum('amount');
            if ($walletTotal <= 0) {
                return null;
            }

            $amountToApply = isset($data['amount']) && $data['amount'] > 0
                ? min((float) $data['amount'], $walletTotal, $balance)
                : min($walletTotal, $balance);

            $remainingToApply = $amountToApply;

            foreach ($walletDeposits as $deposit) {
                if ($remainingToApply <= 0) break;

                $available = $deposit->amount;
                $applyFromThis = min($available, $remainingToApply);

                if ($applyFromThis >= $available) {
                    // Full deposit applied — re-link
                    $deposit->invoice_id = $invoice->id;
                    $deposit->save();
                    $remainingToApply -= $available;
                } else {
                    // Partial — split: create a new payment linked to invoice for the partial amount
                    $newPayment = Payment::create([
                        'deceased_id' => $invoice->deceased_id,
                        'invoice_id' => $invoice->id,
                        'payment_mode_id' => $deposit->payment_mode_id,
                        'receipt_number' => 'REC-' . strtoupper(Str::random(8)),
                        'amount' => $applyFromThis,
                        'payment_method' => $deposit->payment_method,
                        'transaction_reference' => $deposit->transaction_reference,
                        'payment_date' => now(),
                        'notes' => ($deposit->notes ?? '') . " (Wallet settlement: ₦{$applyFromThis} of ₦{$available} from receipt {$deposit->receipt_number})",
                        'received_by' => $appliedBy,
                    ]);

                    // Reduce original wallet deposit
                    $deposit->amount = $available - $applyFromThis;
                    $deposit->save();

                    $remainingToApply -= $applyFromThis;
                }
            }

            // Update invoice paid_amount and status
            $invoice->paid_amount = $invoice->payments()->sum('amount');
            $invoice->status = $invoice->paid_amount >= $invoice->total_amount
                ? 'Paid'
                : ($invoice->paid_amount > 0 ? 'Partially Paid' : 'Unpaid');
            $invoice->save();

            activity('payment')
                ->causedBy(auth()->user())
                ->withProperties([
                    'invoice_id' => $invoice->id,
                    'deceased_id' => $invoice->deceased_id,
                    'wallet_amount_applied' => $amountToApply,
                    'new_paid_amount' => $invoice->paid_amount,
                    'new_status' => $invoice->status,
                ])
                ->log('wallet_applied_to_invoice');

            return $newPayment ?? $walletDeposits->firstWhere('invoice_id', $invoice->id);
        });
    }

    /**
     * Get the wallet (general deposit) balance for a deceased.
     */
    public function getWalletBalance(int $deceasedId): float
    {
        return (float) Payment::where('deceased_id', $deceasedId)
            ->whereNull('invoice_id')
            ->sum('amount');
    }
}
```

#### B. New Controller Method: `PaymentController::applyWalletToInvoice()`

```php
public function applyWalletToInvoice(
    StoreWalletApplicationRequest $request,
    ApplyWalletToInvoice $applyWalletToInvoice
): RedirectResponse {
    $applyWalletToInvoice->handle($request->validated(), (string) $request->user()->id);

    return back()->with('flash', [
        'type' => 'success',
        'message' => 'Wallet balance applied to invoice successfully.',
    ]);
}
```

#### C. New Form Request: `app/Http/Requests/StoreWalletApplicationRequest.php`

```php
<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWalletApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('payments.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'deceased_id' => ['required', 'exists:deceased,id'],
            'invoice_id' => ['required', Rule::exists('invoices', 'id')],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $invoice = Invoice::find($this->input('invoice_id'));
            if ($invoice && $invoice->deceased_id !== $this->input('deceased_id')) {
                $validator->errors()->add('invoice_id', 'The selected invoice does not belong to the deceased record.');
            }
        }];
    }
}
```

#### D. New Route: `routes/web.php`

```php
Route::post('payments/apply-wallet-to-invoice', [PaymentController::class, 'applyWalletToInvoice'])
    ->name('payments.apply-wallet-to-invoice');
```

Also update `InvoiceController::show()` to pass wallet balance data.

#### E. Pass wallet balance to InvoiceController show

Update `InvoiceController::show` to compute and pass the wallet balance:

```php
public function show(Invoice $invoice): Response
{
    Gate::authorize('invoices.view');

    $invoice->load(['deceased', 'invoiceItems.service', 'payments', 'createdByUser']);

    $walletBalance = 0.0;
    if ($invoice->deceased) {
        $walletBalance = (float) Payment::where('deceased_id', $invoice->deceased->id)
            ->whereNull('invoice_id')
            ->sum('amount');
    }

    $paymentModes = PaymentMode::where('is_active', true)->orderBy('name')->get();

    return Inertia::render('invoices/show', [
        'invoice' => $invoice,
        'paymentModes' => $paymentModes,
        'walletBalance' => $walletBalance,
        'can' => [
            'managePayments' => auth()->user()?->can('payments.manage'),
        ],
    ]);
}
```

#### F. Pass wallet balance to DeceasedController show

Update `DeceasedController::show()` to pass the general-deposit (wallet) payments list and total:

```php
// In the show() method, after loading deceased:
$walletDeposits = Payment::where('deceased_id', $deceased->id)
    ->whereNull('invoice_id')
    ->with('paymentMode')
    ->latest()
    ->get();

return Inertia::render('deceased/show', [
    'deceased' => $deceased,
    'availableServices' => $availableServices,
    'storageServiceId' => $storageServiceId,
    'paymentModes' => $paymentModes,
    'walletDeposits' => $walletDeposits,
    'walletBalance' => $walletDeposits->sum('amount'),
    'can' => [
        'edit' => auth()->user()?->can('deceased.edit'),
        'delete' => auth()->user()?->can('deceased.delete'),
        'transfer' => auth()->user()?->can('transfers.create'),
        'managePayments' => auth()->user()?->can('payments.manage'),
    ],
]);
```

### 2.2 Frontend Changes

#### A. Deceased Show Page (`resources/js/pages/deceased/show.tsx`)

1. **Add wallet balance info + "Apply Wallet" UI** to the Record Payment dialog.
2. When the invoice is selected (unpaid), show:
   - Invoice summary (Part 1)
   - Available wallet balance
   - A checkbox: "Apply wallet balance to this invoice"
   - When checked, a number input for amount (defaults to min(wallet, outstanding balance))
   - An "Apply Wallet" button that POSTs to `/payments/apply-wallet-to-invoice`

**Props to add to `Props` interface:**
```tsx
interface Props {
    deceased: Deceased;
    availableServices: AvailableService[];
    storageServiceId: string | null;
    paymentModes: PaymentMode[];
    walletDeposits: WalletDeposit[];
    walletBalance: number;
    can: { edit: boolean; delete: boolean; transfer: boolean; managePayments: boolean };
}
```

**New interface:**
```tsx
interface WalletDeposit {
    id: string;
    receipt_number: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    notes: string | null;
}
```

#### B. Invoice Show Page (`resources/js/pages/invoices/show.tsx`)

1. **Add wallet balance display** to the payment dialog.
2. Show available wallet balance for the deceased.
3. Add a checkbox: "Apply wallet balance to invoice".
4. When checked, show amount input and an "Apply" button or integrate with the existing payment form submit (when "Use Wallet" is checked, the POST to `/payments` is replaced/intercepted by a wallet-application call).

### 2.3 Testing Plan

New test cases in `tests/Feature/BillingAndPaymentsTest.php`:

1. **`it can apply wallet deposits to a partially-paid invoice`**
   - Create deceased with an unpaid invoice (total 1000, paid 0)
   - Create a general deposit of 500 (wallet_balance = 500)
   - POST to `/payments/apply-wallet-to-invoice`
   - Assert payment's `invoice_id` is now set to the invoice
   - Assert invoice `paid_amount` = 500, status = 'Partially Paid'
   - Assert wallet balance is now 0

2. **`it can partially apply a wallet deposit to an invoice`**
   - Create deceased with unpaid invoice (total 1000, paid 0)
   - Create a single general deposit of 1500 (wallet_balance = 1500)
   - POST to `/payments/apply-wallet-to-invoice` with amount = 800
   - Assert a new payment of 800 was created with `invoice_id` set
   - Assert original deposit reduced to 700
   - Assert invoice `paid_amount` = 800, status = 'Partially Paid'

3. **`it can fully settle an invoice from wallet`**
   - Create deceased with unpaid invoice (total 1000, paid 0)
   - Create general deposit of 1000
   - Apply wallet to full
   - Assert invoice status = 'Paid', paid_amount = 1000
   - Assert wallet balance = 0

4. **`it prevents applying wallet from a different deceased's invoice`**
   - Assert 422 error when invoice_id doesn't match deceased_id

5. **`it prevents applying wallet when invoice is fully paid`**
   - Create fully paid invoice, attempt wallet application
   - Assert no changes, redirect with error

---

## Implementation Order

| Step | Description | Files |
|------|-------------|-------|
| 1 | Create `ApplyWalletToInvoice` action | `app/Actions/ApplyWalletToInvoice.php` |
| 2 | Create `StoreWalletApplicationRequest` form request | `app/Http/Requests/StoreWalletApplicationRequest.php` |
| 3 | Add `applyWalletToInvoice` controller method | `app/Http/Controllers/PaymentController.php` |
| 4 | Add route for wallet application | `routes/web.php` |
| 5 | Update `InvoiceController::show` to pass wallet balance | `app/Http/Controllers/InvoiceController.php` |
| 6 | Update `DeceasedController::show` to pass wallet deposits | `app/Http/Controllers/DeceasedController.php` |
| 7 | Add `walletBalance` accessor to `Invoice` model | `app/Models/Invoice.php` |
| 8 | Add invoice summary panel to Deceased Show payment dialog | `resources/js/pages/deceased/show.tsx` |
| 9 | Add invoice summary panel to Invoice Show payment dialog | `resources/js/pages/invoices/show.tsx` |
| 10 | Add "Apply Wallet to Invoice" UI to both pages | `resources/js/pages/deceased/show.tsx`, `resources/js/pages/invoices/show.tsx` |
| 11 | Write Pest tests for all scenarios | `tests/Feature/BillingAndPaymentsTest.php` |
| 12 | Run pint, tests, lint | CLI |

---

## Risk & Edge Cases

1. **Concurrent modifications**: Use `DB::transaction` + `lockForUpdate()` on invoice and wallet deposits to prevent race conditions.
2. **Partial split deposits**: When a single deposit exceeds the outstanding balance, create a new payment record for the applied portion and reduce the original deposit. The `receipt_number` unique constraint is handled via `Str::random`.
3. **Activity logging**: Use Spatie `activity()` to log wallet applications for audit trail.
4. **Permission enforcement**: `StoreWalletApplicationRequest::authorize()` checks `payments.manage` permission; backend Gate in controller also enforces.
5. **Validation**: Ensure `amount` does not exceed `min(wallet_balance, invoice_outstanding_balance)`.
6. **UI-only concern**: The frontend wallet application button should only render when `can.managePayments` is true AND `walletBalance > 0` AND invoice is not fully paid.
7. **Invoice status `Draft`**: Invoices created via the migration default to `Draft`, but `saveInvoice` sets `Unpaid`. The `ApplyWalletToInvoice` action should handle `Draft` status gracefully (treat like unpaid).

---

## Non-Goals

- No new tables or migrations (reuse existing `payments` and `invoices` schema).
- No changes to the core `RecordPayment` action (it handles new payment recording, which is separate from wallet application).
- No changes to release flow (though the wallet application could optionally be invoked during release to settle before release — considered future work).
- No changes to the `payments/index` listing page.
