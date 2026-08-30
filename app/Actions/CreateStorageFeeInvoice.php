<?php

namespace App\Actions;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\ServicePrice;
use App\Models\StorageFeeLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateStorageFeeInvoice
{
    /**
     * Create a storage fee invoice covering uncovered days.
     *
     * @param  int  $lastCoveredDay  The last day already covered by previous storage invoices (0 = none)
     */
    public function handle(Deceased $deceased, string $createdBy, int $lastCoveredDay = 0): ?Invoice
    {
        if ($deceased->chamber_id === null) {
            return null;
        }

        $storageServiceId = $deceased->chamber?->service_id;
        if ($storageServiceId === null) {
            return null;
        }

        $daysInStorage = $deceased->days_in_storage;
        $newDaysToBill = max(0, $daysInStorage - $lastCoveredDay);

        if ($newDaysToBill <= 0) {
            return null;
        }

        $servicePrice = ServicePrice::where('service_id', $storageServiceId)
            ->where('service_category_id', $deceased->service_category_id)
            ->where(function ($query) use ($deceased) {
                $query->whereNull('source')
                    ->orWhere('source', $deceased->source);
            })
            ->first();

        if (! $servicePrice) {
            return null;
        }

        $charge = $servicePrice->calculateStorageCharge($newDaysToBill);

        $invoice = DB::transaction(function () use ($deceased, $storageServiceId, $lastCoveredDay, $newDaysToBill, $charge, $createdBy, $servicePrice) {
            $invoice = Invoice::create([
                'deceased_id' => $deceased->id,
                'invoice_number' => 'STO-'.strtoupper(Str::random(8)),
                'subtotal' => $charge,
                'discount' => 0.00,
                'tax' => 0.00,
                'total_amount' => $charge,
                'paid_amount' => 0.00,
                'status' => 'Unpaid',
                'billing_type' => 'storage',
                'period_start_date' => now()->toDateString(),
                'created_by' => $createdBy,
            ]);

            $serviceName = $servicePrice->service?->name ?? 'Storage Fee';

            $invoice->invoiceItems()->create([
                'service_id' => $storageServiceId,
                'name' => $serviceName,
                'unit_price' => $charge,
                'quantity' => $newDaysToBill,
                'total_price' => $charge,
            ]);

            StorageFeeLog::create([
                'deceased_id' => $deceased->id,
                'invoice_id' => $invoice->id,
                'days_billed' => $newDaysToBill,
                'days_covered_from' => $lastCoveredDay + 1,
                'days_covered_to' => $lastCoveredDay + $newDaysToBill,
                'amount' => $charge,
                'paid_days_at_creation' => $lastCoveredDay,
                'created_by' => $createdBy,
            ]);

            return $invoice;
        });

        return $invoice;
    }
}
