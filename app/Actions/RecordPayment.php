<?php

namespace App\Actions;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use App\Support\DocumentNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordPayment
{
    /** @param array<string, mixed> $validated */
    public function handle(array $validated, string $receivedBy): Payment
    {
        return DB::transaction(function () use ($validated, $receivedBy): Payment {
            $paymentMode = PaymentMode::query()
                ->whereKey($validated['payment_mode_id'])
                ->where('is_active', true)
                ->lockForUpdate()
                ->firstOrFail();
            $invoice = ! empty($validated['invoice_id']) ? Invoice::query()->lockForUpdate()->findOrFail((string) $validated['invoice_id']) : null;

            if ($invoice && $invoice->deceased_id !== $validated['deceased_id']) {
                abort(422, 'The selected invoice does not belong to the deceased record.');
            }

            // Receipts carry the branch slug of the branch the deceased is
            // placed in (via its chamber), falling back to the default branch.
            $deceased = Deceased::with('chamber.branch')->find($validated['deceased_id']);
            $branchSlug = $deceased->chamber?->branch?->slug ?? null;

            if ($invoice) {
                $balance = (float) $invoice->total_amount - (float) $invoice->paid_amount - (float) $invoice->waived_amount;

                if ($validated['amount'] > max(0, $balance)) {
                    throw ValidationException::withMessages([
                        'amount' => "Payment amount exceeds the outstanding balance of {$balance}.",
                    ]);
                }
            }

            $payment = Payment::create([
                'deceased_id' => $validated['deceased_id'],
                'invoice_id' => $invoice?->id,
                'payment_mode_id' => $paymentMode->id,
                'payment_method' => $paymentMode->name,
                'receipt_number' => DocumentNumber::receipt($branchSlug),
                'amount' => $validated['amount'],
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'payment_date' => $validated['payment_date'],
                'notes' => $validated['notes'] ?? null,
                'received_by' => $receivedBy,
            ]);

            if ($invoice) {
                // A waiver covers part of the total, so "settled" is the sum of
                // cash payments AND waived amounts — same formula ApplyWaiver
                // uses. The status must not depend on the order the waiver or
                // this payment was applied in.
                $invoice->paid_amount = min((float) $invoice->payments()->sum('amount'), (float) $invoice->total_amount);
                $wasUnpaid = $invoice->status === 'Unpaid';
                $invoice->status = ((float) $invoice->paid_amount + (float) $invoice->waived_amount >= (float) $invoice->total_amount)
                    ? 'Paid'
                    : ((float) $invoice->paid_amount > 0 || (float) $invoice->waived_amount > 0 ? 'Partially Paid' : 'Unpaid');
                $invoice->save();

                if ($invoice->billing_type === 'storage' && $invoice->status === 'Paid' && $wasUnpaid) {
                    $this->maybeAutoGenerateNextStorageInvoice($invoice->deceased_id);
                }
            }

            return $payment;
        });
    }

    /**
     * If a storage invoice just became fully paid, check if new days have elapsed
     * and auto-generate the next storage invoice.
     */
    private function maybeAutoGenerateNextStorageInvoice(string $deceasedId): void
    {
        $deceased = Deceased::with('storageFeeLogs')->find($deceasedId);
        if (! $deceased) {
            return;
        }

        $lastCoveredDay = (int) ($deceased->storageFeeLogsForCurrentAdmission()->max('days_covered_to') ?? 0);
        $daysInStorage = $deceased->days_in_storage;
        $newDays = max(0, $daysInStorage - $lastCoveredDay);

        if ($newDays <= 0 || $deceased->status !== 'InChamber') {
            return;
        }

        $action = app(CreateStorageFeeInvoice::class);
        $action->handle($deceased, (string) (auth()->id() ?? '000000000000000000000000'), $lastCoveredDay);
    }
}
