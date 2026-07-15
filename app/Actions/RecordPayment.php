<?php

namespace App\Actions;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

            $payment = Payment::create([
                'deceased_id' => $validated['deceased_id'], 'invoice_id' => $invoice?->id,
                'payment_mode_id' => $paymentMode->id, 'payment_method' => $paymentMode->name,
                'receipt_number' => 'REC-'.strtoupper(Str::random(8)), 'amount' => $validated['amount'],
                'transaction_reference' => $validated['transaction_reference'] ?? null, 'payment_date' => $validated['payment_date'],
                'notes' => $validated['notes'] ?? null, 'received_by' => $receivedBy,
            ]);

            if ($invoice) {
                $invoice->paid_amount = $invoice->payments()->sum('amount');
                $invoice->status = $invoice->paid_amount >= $invoice->total_amount ? 'Paid' : ($invoice->paid_amount > 0 ? 'Partially Paid' : 'Unpaid');
                $invoice->save();
            }

            return $payment;
        });
    }
}
