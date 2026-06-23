<?php

namespace App\Models;

use Database\Factories\ServicePriceFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class ServicePrice extends Model
{
    /** @use HasFactory<ServicePriceFactory> */
    use HasFactory, HasUlids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'service_id',
        'service_category_id',
        'price',
        'source',
    ];

    /**
     * Get the service associated with the price.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the service category associated with the price.
     */
    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    /**
     * Get the price tiers for this service price.
     */
    public function servicePriceTiers(): HasMany
    {
        return $this->hasMany(ServicePriceTier::class)->orderBy('start_day');
    }

    /**
     * Calculate the storage fee based on the number of days spent.
     */
    public function calculateStorageCharge(int $days): float
    {
        $tiers = $this->servicePriceTiers;

        if ($tiers->isEmpty()) {
            return (float) ($days * $this->price);
        }

        $totalCharge = 0.0;
        foreach ($tiers as $tier) {
            if ($days >= $tier->start_day) {
                $endDay = $tier->end_day ?? $days;
                $activeDaysInTier = min($days, $endDay) - $tier->start_day + 1;
                if ($activeDaysInTier > 0) {
                    $totalCharge += $activeDaysInTier * (float) $tier->price;
                }
            }
        }

        return $totalCharge;
    }
}
