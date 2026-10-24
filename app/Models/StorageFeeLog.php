<?php

namespace App\Models;

use Database\Factories\StorageFeeLogFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorageFeeLog extends Model
{
    /** @use HasFactory<StorageFeeLogFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'deceased_id',
        'invoice_id',
        'days_billed',
        'days_covered_from',
        'days_covered_to',
        'amount',
        'paid_days_at_creation',
        'created_by',
        'admission_started_at',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'admission_started_at' => 'datetime',
    ];

    /** @return BelongsTo<Deceased, $this> */
    public function deceased(): BelongsTo
    {
        return $this->belongsTo(Deceased::class);
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return BelongsTo<User, $this> */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
