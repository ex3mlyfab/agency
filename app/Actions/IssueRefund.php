<?php

namespace App\Actions;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use App\Support\DocumentNumber;

class IssueRefund
{
    /**
     * Issue a refund invoice for a storage surplus.
     *
     * When a record's storage ledger is in surplus (more paid/waived than
     * billed across all admissions), the excess is owed back to the account.
     * This books a refund invoice with a *negative* total so the ledger nets
     * to zero, and records a negative receipt so the money movement is
     * auditable.
     *
     * @return Invoice|null The refund invoice, or null when there
     *                      is no surplus to refund.
     */
    public function handle(string $deceasedId, float $surplus, string $issuedBy, ?string $notes = null): ?Invoice
    {
        if ($surplus <= 0.0) {
            return null;
        }

        // Refund documents carry the branch slug of the branch the deceased
        // was placed in (via its chamber), falling back to the default branch.
        $deceased = Deceased::with('chamber.branch')->find($deceasedId);
        $branchSlug = $deceased->chamber?->branch?->slug ?? null;

        $refund = Invoice::create([
            'deceased_id' => $deceasedId,
            'invoice_number' => DocumentNumber::refundInvoice($branchSlug),
            'subtotal' => -$surplus,
            'total_amount' => -$surplus,
            'paid_amount' => 0.00,
            'waived_amount' => 0.00,
            'status' => 'Refunded',
            'billing_type' => 'refund',
            'notes' => $notes ?? 'Storage refund issued on release.',
            'created_by' => $issuedBy,
        ]);

        // Book the refund as a negative general receipt so the payment ledger
        // reflects money leaving the account (not just a zeroing of the
        // invoice). Using a general (invoice-less) payment keeps it tied to
        // the account rather than a single admission.
        $mode = PaymentMode::query()->where('is_active', true)->orderBy('name')->first();

        Payment::create([
            'deceased_id' => $deceasedId,
            'invoice_id' => null,
            'payment_mode_id' => $mode?->id,
            'receipt_number' => DocumentNumber::refund($branchSlug),
            'amount' => -$surplus,
            'payment_method' => $mode->name ?? 'Refund',
            'transaction_reference' => null,
            'payment_date' => now(),
            'notes' => $notes ?? 'Storage refund issued on release.',
            'received_by' => $issuedBy,
        ]);

        return $refund;
    }
}
