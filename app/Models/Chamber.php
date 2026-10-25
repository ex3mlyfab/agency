<?php

namespace App\Models;

use App\Enums\DeceasedStatus;
use Database\Factories\ChamberFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Chamber extends Model
{
    /** @use HasFactory<ChamberFactory> */
    use HasFactory, HasUlids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'location',
        'capacity',
        'notes',
        'service_id',
        'branch_id',
    ];

    /**
     * The branch this chamber belongs to.
     *
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * All deceased currently assigned to this chamber.
     *
     * @return HasMany<Deceased, $this>
     */
    public function occupants(): HasMany
    {
        return $this->hasMany(Deceased::class)->where('status', DeceasedStatus::InChamber);
    }

    /**
     * The storage service attached to this chamber.
     *
     * @return BelongsTo<Service, $this>
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * All transfer events involving this chamber.
     *
     * @return HasMany<Transfer, $this>
     */
    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class, 'to_chamber_id')->latest('transferred_at');
    }

    /**
     * The most recent "Entered" transfer into this chamber.
     *
     * Eager-load via `with('latestEntryTransfer')` to avoid per-row queries.
     *
     * @return HasOne<Transfer, $this>
     */
    public function latestEntryTransfer(): HasOne
    {
        return $this->hasOne(Transfer::class, 'to_chamber_id')
            ->where('event_type', 'Entered')
            ->latestOfMany('transferred_at');
    }

    /**
     * Get occupancy status label.
     *
     * Uses the pre-loaded `occupants_count` (from withCount) when available
     * to avoid a per-row query; falls back to `exists()` otherwise.
     */
    public function getOccupancyStatusAttribute(): string
    {
        $count = $this->occupants_count ?? $this->occupants()->count();

        return $count > 0 ? 'In use' : 'Empty';
    }

    /**
     * Get days the current occupant has been in this chamber.
     *
     * Uses the eager-loaded `latestEntryTransfer` relation when available
     * to avoid a per-row query; returns null when empty.
     */
    public function getDaysInChamberAttribute(): ?int
    {
        $entry = $this->relationLoaded('latestEntryTransfer') ? $this->latestEntryTransfer : null;

        if (! $entry) {
            return null;
        }

        return (int) now()->diffInDays($entry->transferred_at);
    }
}
