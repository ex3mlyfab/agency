<?php

namespace App\Actions;

use App\Models\Invoice;
use App\Models\Waiver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApplyWaiver
{
    /** @param array<string, mixed> $validated */
    public function handle(array $validated, string $authorizedBy): Waiver
    {
        return DB::transaction(function () use ($validated, $authorizedBy): Waiver {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($validated['invoice_id']);

            if ($invoice->deceased_id != $validated['deceased_id']) {
                throw ValidationException::withMessages([
                    'invoice_id' => 'The selected invoice does not belong to the deceased record.',
                ]);
            }

            $balance = (float) $invoice->total_amount - (float) $invoice->paid_amount - (float) $invoice->waived_amount;

            if ($balance <= 0) {
                throw ValidationException::withMessages([
                    'amount' => 'This invoice has no outstanding balance to waive.',
                ]);
            }

            $amount = (float) $validated['amount'];

            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => 'Waiver amount must be greater than zero.',
                ]);
            }

            if ($amount > $balance) {
                throw ValidationException::withMessages([
                    'amount' => "Waiver amount cannot exceed the outstanding balance of {$balance}.",
                ]);
            }

            $waiver = Waiver::create([
                'deceased_id' => $invoice->deceased_id,
                'invoice_id' => $invoice->id,
                'amount' => $amount,
                'reason' => $validated['reason'] ?? null,
                'authorized_by' => $authorizedBy,
                'authorized_at' => now(),
            ]);

            $invoice->waived_amount = min(
                (float) $invoice->waived_amount + $amount,
                (float) $invoice->total_amount - (float) $invoice->paid_amount
            );
            $invoice->status = $invoice->paid_amount + $invoice->waived_amount >= $invoice->total_amount
                ? 'Paid'
                : ($invoice->paid_amount > 0 || $invoice->waived_amount > 0 ? 'Partially Paid' : 'Unpaid');
            $invoice->save();

            return $waiver;
        });
    }
}
