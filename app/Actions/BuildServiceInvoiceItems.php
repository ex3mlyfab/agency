<?php

namespace App\Actions;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Service;
use App\Models\ServicePrice;
use Illuminate\Validation\ValidationException;

class BuildServiceInvoiceItems
{
    /**
     * Build invoice line items from validated service selections.
     *
     * Pre-loads all required service names and prices in bulk to avoid
     * per-row N+1 queries.
     *
     * @param  array<int, array{service_id: string|int, quantity: int}>  $items
     */
    public function handle(Invoice $invoice, Deceased $deceased, array $items, ?string $notes = null): float
    {
        $serviceIds = collect($items)->pluck('service_id')->all();
        $serviceNames = Service::whereIn('id', $serviceIds)->pluck('name', 'id');

        $pricePairs = collect($items)->mapWithKeys(function ($item) use ($deceased) {
            return [
                $item['service_id'] => $this->resolveUnitPrice($item['service_id'], $deceased),
            ];
        });

        $subtotal = 0.0;

        foreach ($items as $item) {
            $serviceId = $item['service_id'];
            $unitPrice = $pricePairs[$serviceId] ?? 0.0;
            $quantity = (int) $item['quantity'];
            $totalPrice = $unitPrice * $quantity;

            $subtotal += $totalPrice;

            $invoice->invoiceItems()->create([
                'service_id' => $serviceId,
                'name' => $serviceNames[$serviceId] ?? 'Unknown Service',
                'unit_price' => $unitPrice,
                'quantity' => $quantity,
                'total_price' => $totalPrice,
            ]);
        }

        $invoice->update([
            'subtotal' => $subtotal,
            'total_amount' => $subtotal,
            'notes' => $notes,
        ]);

        return $subtotal;
    }

    private function resolveUnitPrice(string|int $serviceId, Deceased $deceased): float
    {
        $servicePrice = ServicePrice::where('service_id', $serviceId)
            ->where('service_category_id', $deceased->service_category_id)
            ->where(function ($query) use ($deceased) {
                $query->whereNull('source')
                    ->orWhere('source', $deceased->source);
            })
            ->first();

        if (! $servicePrice) {
            // A line item must never be silently billed at a zero price.
            throw ValidationException::withMessages([
                'items' => 'No price is configured for one of the selected services under this category. Set up a service price first.',
            ]);
        }

        return (float) $servicePrice->price;
    }
}
