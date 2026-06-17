<?php

namespace App\Models;

use Database\Factories\ChamberFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
    ];

    /**
     * All deceased currently assigned to this chamber.
     */
    public function occupants(): HasMany
    {
        return $this->hasMany(Deceased::class)->where('status', 'InChamber');
    }

    /**
     * All transfer events involving this chamber.
     */
    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class, 'to_chamber_id')->latest('transferred_at');
    }

    /**
     * Get occupancy status label.
     */
    public function getOccupancyStatusAttribute(): string
    {
        return $this->occupants()->exists() ? 'In use' : 'Empty';
    }

    /**
     * Get days the current occupant has been in this chamber.
     *
     * Returns null when empty.
     */
    public function getDaysInChamberAttribute(): ?int
    {
        $latestEntry = Transfer::where('to_chamber_id', $this->id)
            ->where('event_type', 'Entered')
            ->latest('transferred_at')
            ->first();

        if (! $latestEntry) {
            return null;
        }

        return (int) now()->diffInDays($latestEntry->transferred_at);
    }
}
