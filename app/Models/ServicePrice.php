<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
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
     * Find a ServicePrice by service, category, and source (cached).
     *
     * @return self|null
     */
    public static function findByServiceCategorySource(string $serviceId, string $categoryOrSource, string $source): ?self
    {
        $cacheKey = "service_price:{$serviceId}:{$categoryOrSource}:{$source}";

        return Cache::remember($cacheKey, 3600, function () use ($serviceId, $categoryOrSource, $source) {
            return static::query()
                ->where('service_id', $serviceId)
                ->where('service_category_id', $categoryOrSource)
                ->where(function ($query) use ($source) {
                    $query->whereNull('source')
                        ->orWhere('source', $source);
                })
                ->with('servicePriceTiers')
                ->first();
        });
    }

    /**
     * Calculate the storage fee based on the total number of days spent.
     */
    public function calculateStorageCharge(int $days): float
    {
        return $this->calculateStorageChargeForRange(1, max(0, $days));
    }

    /**
     * Calculate the storage fee for a specific absolute day range.
     *
     * Tiers are absolute day ranges (e.g. day 1-5 @ A, day 6-10 @ B, day 11+ @ C).
     * This bills the days in [$fromDay, $toDay] at the tier that owns each day,
     * so it is correct whether the range starts at day 1 or mid-way through the
     * stay. Days in a gap between two tiers bill at the preceding tier's rate
     * (the last seen tier is carried forward); days before the first tier bill
     * at the flat service price.
     *
     * @param  int  $fromDay  First day of the range (1-based absolute day)
     * @param  int  $toDay  Last day of the range (1-based absolute day)
     */
    public function calculateStorageChargeForRange(int $fromDay, int $toDay): float
    {
        if ($toDay < $fromDay) {
            return 0.0;
        }

        $tiers = $this->servicePriceTiers;

        if ($tiers->isEmpty()) {
            return (float) (($toDay - $fromDay + 1) * $this->price);
        }

        $totalCharge = 0.0;

        foreach ($tiers as $index => $tier) {
            $startDay = (int) $tier->start_day;
            $isLast = $index === $tiers->count() - 1;
            // Open-ended tier (end_day null) covers everything from startDay on.
            $endDay = $tier->end_day !== null ? (int) $tier->end_day : $toDay;

            // The tier owns days [startDay, endDay]. Bill only the portion that
            // falls inside the requested range.
            $effectiveStart = max($startDay, $fromDay);
            $effectiveEnd = min($endDay, $toDay);
            if ($effectiveStart <= $effectiveEnd) {
                $totalCharge += ($effectiveEnd - $effectiveStart + 1) * (float) $tier->price;
            }

            // Carry this tier's rate forward across a gap between it and the next
            // tier. The gap runs from this tier's end_day + 1 up to just before
            // the next tier starts. Only applies to a bounded, non-last tier.
            if (! $isLast && $tier->end_day !== null) {
                $nextStartDay = (int) $tiers[$index + 1]->start_day;
                $gapStart = (int) $tier->end_day + 1;
                $gapEnd = $nextStartDay - 1;
                if ($gapStart <= $gapEnd) {
                    $overlapStart = max($gapStart, $fromDay);
                    $overlapEnd = min($gapEnd, $toDay);
                    if ($overlapStart <= $overlapEnd) {
                        $totalCharge += ($overlapEnd - $overlapStart + 1) * (float) $tier->price;
                    }
                }
            }
        }

        // Trailing gap after the last tier: only when the last tier is bounded
        // and the requested range extends past it. Bill at the last tier's rate.
        $lastTier = $tiers->last();
        $trailingStart = $lastTier->end_day !== null
            ? max($fromDay, (int) $lastTier->end_day + 1)
            : null;
        if ($trailingStart !== null && $trailingStart <= $toDay) {
            $totalCharge += ($toDay - $trailingStart + 1) * (float) $lastTier->price;
        }

        // Leading gap before the first tier bills at the flat service price.
        $firstTierStart = (int) $tiers->first()->start_day;
        if ($fromDay < $firstTierStart) {
            $totalCharge += (min($firstTierStart, $toDay + 1) - $fromDay) * (float) $this->price;
        }

        return $totalCharge;
    }
}
