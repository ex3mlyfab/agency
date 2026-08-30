<?php

namespace App\Actions;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApplyWalletToInvoice
{
    /** @param array<string, mixed> $validated */
    public function handle(array $validated, string $appliedBy): ?Payment
    {
        return DB::transaction(function () use ($validated, $appliedBy): ?Payment {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($validated['invoice_id']);

            if ($invoice->deceased_id != $validated['deceased_id']) {
                abort(422, 'The selected invoice does not belong to the deceased record.');
            }

            $balance = (float) $invoice->total_amount - (float) $invoice->paid_amount - (float) $invoice->waived_amount;

            if ($balance <= 0) {
                return null;
            }

            $walletDeposits = Payment::query()
                ->where('deceased_id', $invoice->deceased_id)
                ->whereNull('invoice_id')
                ->lockForUpdate()
                ->orderBy('payment_date')
                ->orderBy('created_at')
                ->get();

            if ($walletDeposits->isEmpty()) {
                return null;
            }

            $walletTotal = (float) $walletDeposits->sum('amount');

            if ($walletTotal <= 0) {
                return null;
            }

            $amountToApply = isset($validated['amount']) && $validated['amount'] > 0
                ? min((float) $validated['amount'], $walletTotal, $balance)
                : min($walletTotal, $balance);

            $remainingToApply = $amountToApply;
            $appliedPayment = null;

            foreach ($walletDeposits as $deposit) {
                if ($remainingToApply <= 0) {
                    break;
                }

                $available = (float) $deposit->amount;
                $applyFromThis = min($available, $remainingToApply);

                if ((float) $applyFromThis >= $available) {
                    $deposit->invoice_id = $invoice->id;
                    $deposit->save();
                    $appliedPayment = $deposit;
                    $remainingToApply -= $available;
                } else {
                    $appliedPayment = Payment::create([
                        'deceased_id' => $invoice->deceased_id,
                        'invoice_id' => $invoice->id,
                        'payment_mode_id' => $deposit->payment_mode_id,
                        'receipt_number' => 'REC-'.strtoupper(Str::random(8)),
                        'amount' => $applyFromThis,
                        'payment_method' => $deposit->payment_method,
                        'transaction_reference' => $deposit->transaction_reference,
                        'payment_date' => now(),
                        'notes' => 'Wallet settlement: '.($deposit->notes ?? '')." — applied ₦{$applyFromThis} of ₦{$available} from receipt {$deposit->receipt_number}.",
                        'received_by' => $appliedBy,
                    ]);

                    $deposit->amount = $available - $applyFromThis;
                    $deposit->save();

                    $remainingToApply -= $applyFromThis;
                }
            }

            $invoice->paid_amount = $invoice->payments()->sum('amount');
            $wasUnpaid = $invoice->status === 'Unpaid';
            $invoice->status = $invoice->paid_amount >= $invoice->total_amount
                ? 'Paid'
                : ($invoice->paid_amount > 0 ? 'Partially Paid' : 'Unpaid');
            $invoice->save();

            if ($invoice->billing_type === 'storage' && $invoice->status === 'Paid' && $wasUnpaid) {
                $this->maybeAutoGenerateNextStorageInvoice($invoice->deceased_id);
            }

            return $appliedPayment;
        });
    }

    public function getWalletBalance(string $deceasedId): float
    {
        return (float) Payment::where('deceased_id', $deceasedId)
            ->whereNull('invoice_id')
            ->sum('amount');
    }

    private function maybeAutoGenerateNextStorageInvoice(string $deceasedId): void
    {
        $deceased = Deceased::with('storageFeeLogs')->find($deceasedId);
        if (! $deceased) {
            return;
        }

        $lastCoveredDay = $deceased->storageFeeLogs->max('days_covered_to') ?? 0;
        $daysInStorage = $deceased->days_in_storage;
        $newDays = max(0, $daysInStorage - $lastCoveredDay);

        if ($newDays <= 0 || $deceased->status !== 'InChamber') {
            return;
        }

        $action = app(CreateStorageFeeInvoice::class);
        $action->handle($deceased, (string) auth()->id(), $lastCoveredDay);
    }
}
