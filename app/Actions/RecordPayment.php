<?php

namespace App\Actions;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RecordPayment
{
    /** @param array<string, mixed> $validated */
    public function handle(array $validated, string $receivedBy): Payment
    {
        return DB::transaction(function () use ($validated, $receivedBy): Payment {
            $paymentMode = PaymentMode::query()->whereKey($validated['payment_mode_id'])->where('is_active', true)->lockForUpdate()->firstOrFail();
            $invoice = ! empty($validated['invoice_id']) ? Invoice::query()->lockForUpdate()->findOrFail($validated['invoice_id']) : null;

            if ($invoice && $invoice->deceased_id !== $validated['deceased_id']) {
                abort(422, 'The selected invoice does not belong to the deceased record.');
            }

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
                'receipt_number' => 'REC-'.strtoupper(Str::random(8)),
                'amount' => $validated['amount'],
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'payment_date' => $validated['payment_date'],
                'notes' => $validated['notes'] ?? null,
                'received_by' => $receivedBy,
            ]);

            if ($invoice) {
                $invoice->paid_amount = min((float) $invoice->payments()->sum('amount'), (float) $invoice->total_amount);
                $wasUnpaid = $invoice->status === 'Unpaid';
                $invoice->status = $invoice->paid_amount >= $invoice->total_amount
                    ? 'Paid'
                    : ($invoice->paid_amount > 0 ? 'Partially Paid' : 'Unpaid');
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

        $lastCoveredDay = (int) ($deceased->storageFeeLogs->max('days_covered_to') ?? 0);
        $daysInStorage = $deceased->days_in_storage;
        $newDays = max(0, $daysInStorage - $lastCoveredDay);

        if ($newDays <= 0 || $deceased->status !== 'InChamber') {
            return;
        }

        $action = app(CreateStorageFeeInvoice::class);
        $action->handle($deceased, auth()->id() ?? '000000000000000000000000', $lastCoveredDay);
    }
}
