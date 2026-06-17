<?php

namespace App\Models;

use Database\Factories\TransferFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Transfer extends Model
{
    /** @use HasFactory<TransferFactory> */
    use HasFactory, HasUlids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'deceased_id',
        'from_chamber_id',
        'to_chamber_id',
        'transferred_by',
        'event_type',
        'notes',
        'transferred_at',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'transferred_at' => 'datetime',
    ];

    /**
     * The deceased this transfer belongs to.
     */
    public function deceased(): BelongsTo
    {
        return $this->belongsTo(Deceased::class);
    }

    /**
     * The source chamber (where they came from).
     */
    public function fromChamber(): BelongsTo
    {
        return $this->belongsTo(Chamber::class, 'from_chamber_id');
    }

    /**
     * The destination chamber (where they went).
     */
    public function toChamber(): BelongsTo
    {
        return $this->belongsTo(Chamber::class, 'to_chamber_id');
    }

    /**
     * The user who performed the transfer.
     */
    public function transferredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }
}
