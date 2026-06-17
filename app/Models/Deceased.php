<?php

namespace App\Models;

use Database\Factories\DeceasedFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Deceased extends Model
{
    /** @use HasFactory<DeceasedFactory> */
    use HasFactory, HasUlids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    protected static function booted(): void
    {
        static::creating(function (Deceased $deceased) {
            if (empty($deceased->release_code)) {
                $deceased->release_code = 'DEC-'.strtoupper(Str::random(8));
            }
        });
    }

    protected $table = 'deceased';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'picture',
        'date_of_birth',
        'date_of_death',
        'gender',
        'cause_of_death',
        'notes',
        'status',
        'chamber_id',
        'relative_name',
        'relative_phone',
        'relative_relationship',
        'relative_address',
        'release_code',
        'released_to_name',
        'released_to_phone',
        'released_to_relationship',
        'released_to_id_type',
        'released_to_id_number',
        'released_at',
        'released_by',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'date_of_birth' => 'date',
        'date_of_death' => 'date',
        'released_at' => 'datetime',
    ];

    /**
     * Get the full name of the deceased.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * The chamber currently assigned to this deceased.
     */
    public function chamber(): BelongsTo
    {
        return $this->belongsTo(Chamber::class);
    }

    /**
     * The staff member who released this deceased.
     */
    public function releasedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    /**
     * All transfer/history events for this deceased.
     */
    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class)->latest('transferred_at');
    }
}
