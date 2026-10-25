<?php

namespace App\Models;

use App\Enums\BranchStatus;
use Database\Factories\BranchFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Branch extends Model
{
    /** @use HasFactory<BranchFactory> */
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
        'slug',
        'status',
    ];

    /**
     * All chambers that belong to this branch.
     *
     * @return HasMany<Chamber, $this>
     */
    public function chambers(): HasMany
    {
        return $this->hasMany(Chamber::class);
    }

    /**
     * Whether this branch can receive new chamber placements.
     */
    public function isOperational(): bool
    {
        return $this->status === BranchStatus::Active;
    }
}
