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
        'body_tag_number',
        'body_condition',
        'place_of_death',
        'place_of_death_other',
        'hospital_number',
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
        'service_category_id',
        'source',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'date_of_birth' => 'date',
        'date_of_death' => 'datetime',
        'released_at' => 'datetime',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'full_name',
        'total_billed',
        'total_paid',
        'ledger_balance',
        'days_in_storage',
        'days_paid',
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

    /**
     * Get the service category for the deceased.
     */
    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    /**
     * All service invoices for this deceased (non-storage).
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->where('billing_type', 'service')->latest();
    }

    /**
     * All payments / deposits recorded for this deceased.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Storage fee logs for this deceased.
     */
    public function storageFeeLogs(): HasMany
    {
        return $this->hasMany(StorageFeeLog::class)->latest();
    }

    /**
     * Get the total invoice amount for this deceased person (service + all storage invoices).
     */
    public function getTotalBilledAttribute(): float
    {
        $serviceInvoiceTotal = $this->invoices->sum('total_amount');
        $storageInvoiceTotal = $this->storageFeeLogs->sum(function ($log) {
            return $log->invoice ? (float) $log->invoice->total_amount : 0.0;
        });

        return $serviceInvoiceTotal + $storageInvoiceTotal;
    }

    /**
     * Get the total deposits/payments made for this deceased person.
     */
    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    /**
     * Get the total amount waived for this deceased person (service + all storage invoices).
     */
    public function getTotalWaivedAttribute(): float
    {
        $serviceWaived = $this->invoices->sum('waived_amount');
        $storageWaived = $this->storageFeeLogs->sum(function ($log) {
            return $log->invoice ? (float) $log->invoice->waived_amount : 0.0;
        });

        return $serviceWaived + $storageWaived;
    }

    /**
     * Get the outstanding ledger balance.
     * Positive value means outstanding debt. Negative or zero means paid/surplus.
     */
    public function getLedgerBalanceAttribute(): float
    {
        return $this->total_billed - $this->total_paid - $this->total_waived;
    }

    /**
     * Check if the bill is settled.
     */
    public function isBillSettled(): bool
    {
        return $this->ledger_balance <= 0.0;
    }

    /**
     * Check if storage days are fully paid.
     */
    public function isStorageFullyPaid(): bool
    {
        return $this->days_paid >= $this->days_in_storage;
    }

    /**
     * Get the total days spent in storage.
     */
    public function getDaysInStorageAttribute(): int
    {
        $firstEntry = $this->transfers()
            ->where('event_type', 'Entered')
            ->oldest('transferred_at')
            ->first();

        if (! $firstEntry) {
            return 0;
        }

        $endDate = $this->status === 'Released' && $this->released_at
            ? $this->released_at
            : now();

        return (int) $firstEntry->transferred_at->diffInDays($endDate);
    }

    /**
     * Get the number of storage days paid for.
     * Uses storage fee logs when available; falls back to proportional calculation otherwise.
     */
    public function getDaysPaidAttribute(): int
    {
        $storageLogs = $this->storageFeeLogs;

        if ($storageLogs->isNotEmpty()) {
            $totalBilledDays = $storageLogs->sum('days_billed');
            if ($totalBilledDays <= 0) {
                return 0;
            }

            $totalPaidAmount = $storageLogs->sum(function ($log) {
                if (! $log->invoice) {
                    return 0.0;
                }

                $invoicePaid = (float) $log->invoice->paid_amount;
                $invoiceWaived = (float) $log->invoice->waived_amount;
                $invoiceTotal = (float) $log->invoice->total_amount;

                if ($invoiceTotal <= 0) {
                    return 0.0;
                }

                return (($invoicePaid + $invoiceWaived) / $invoiceTotal) * $log->days_billed;
            });

            return (int) round(min((float) $totalBilledDays, $totalPaidAmount));
        }

        // Fallback: proportional calculation from the main invoice
        if ($this->invoices->isEmpty()) {
            return 0;
        }

        $storageServiceId = $this->chamber?->service_id;

        $storageItem = $this->invoices->first()?->invoiceItems
            ->first(function ($item) use ($storageServiceId) {
                if ($storageServiceId) {
                    return $item->service_id === $storageServiceId;
                }

                return stripos($item->name, 'storage') !== false;
            });

        if (! $storageItem || $storageItem->quantity <= 0) {
            return 0;
        }

        $totalPaid = $this->total_paid;
        $totalWaived = $this->total_waived;
        $totalBilled = $this->total_billed;

        if ($totalBilled <= 0) {
            return 0;
        }

        $proportion = min(1.0, ($totalPaid + $totalWaived) / $totalBilled);

        return (int) round($proportion * $storageItem->quantity);
    }
}
