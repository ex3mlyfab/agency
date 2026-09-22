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

            // Enforce storage payment check on release. The gate is lifetime:
            // no admission may leave storage debt unpaid, and the current
            // stay's days must be fully covered.
            if ($validated['event_type'] === 'Released' && ! $deceased->canReleaseStorage()) {
                $message = $deceased->isStorageFullyPaid()
                    ? 'Cannot release: an outstanding storage balance of '.number_format($deceased->lifetimeStorageOutstanding(), 2).' remains across prior admissions.'
                    : 'Cannot release: storage days ('.$deceased->days_in_storage.' days) are not fully paid. Only '.$deceased->days_paid.' days paid for the current admission.';

                throw ValidationException::withMessages(['deceased_id' => $message]);
            }

            $toChamberId = $destination?->id;
            Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $deceased->chamber_id, 'to_chamber_id' => $toChamberId, 'transferred_by' => $transferredBy, 'event_type' => $validated['event_type'], 'notes' => $validated['notes'] ?? null, 'transferred_at' => now()]);
            $deceased->update(['status' => $validated['event_type'] === 'Released' ? 'Released' : 'InChamber', 'chamber_id' => $toChamberId]);

            // Book a refund for any storage surplus on the release.
            if ($validated['event_type'] === 'Released') {
                $surplus = $deceased->lifetimeStorageSurplus();
                if ($surplus > 0) {
                    app(IssueRefund::class)->handle(
                        $deceased->id,
                        $surplus,
                        $transferredBy,
                        'Storage refund issued on release.',
                    );
                }
            }

            return $deceased;
        });
    }
}
