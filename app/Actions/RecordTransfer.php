<?php

namespace App\Actions;

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Transfer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordTransfer
{
    /** @param array<string, mixed> $validated */
    public function handle(array $validated, string $transferredBy): Deceased
    {
        return DB::transaction(function () use ($validated, $transferredBy): Deceased {
            $deceased = Deceased::query()->lockForUpdate()->findOrFail($validated['deceased_id']);
            $destination = ! empty($validated['to_chamber_id']) ? Chamber::query()->lockForUpdate()->findOrFail($validated['to_chamber_id']) : null;

            if ($destination && $destination->occupants()->count() >= $destination->capacity) {
                throw ValidationException::withMessages(['to_chamber_id' => 'The selected chamber is at capacity.']);
            }

            // Enforce storage payment check on release
            if ($validated['event_type'] === 'Released' && ! $deceased->isStorageFullyPaid()) {
                throw ValidationException::withMessages(['deceased_id' => 'Cannot release: storage days ('.$deceased->days_in_storage.' days) are not fully paid. Only '.$deceased->days_paid.' days paid.']);
            }

            $toChamberId = $destination?->id;
            Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $deceased->chamber_id, 'to_chamber_id' => $toChamberId, 'transferred_by' => $transferredBy, 'event_type' => $validated['event_type'], 'notes' => $validated['notes'] ?? null, 'transferred_at' => now()]);
            $deceased->update(['status' => $validated['event_type'] === 'Released' ? 'Released' : 'InChamber', 'chamber_id' => $toChamberId]);

            return $deceased;
        });
    }
}
