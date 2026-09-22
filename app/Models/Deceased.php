<?php

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\DeceasedFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Collection;
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
     * The most recent service invoice for this deceased.
     *
     * Exposed as a computed accessor (not a HasOne) because the schema has no
     * `deceased.invoice_id` column. This lets `deceased.invoice` return the
     * newest service invoice without eager-loading a non-existent relation.
     */
    public function getInvoiceAttribute(): ?Invoice
    {
        return $this->invoices->first();
    }

    /**
     * All payments / deposits recorded for this deceased.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * All storage fee logs for this deceased.
     */
    public function storageFeeLogs(): HasMany
    {
        return $this->hasMany(StorageFeeLog::class)->latest();
    }

    /**
     * Storage fee logs belonging to the *current* continuous admission only.
     *
     * Each log carries `admission_started_at`; a log belongs to the current
     * admission when it matches that admission's start. Logs that were created
     * before the column existed (admission_started_at is null) are included
     * conservatively so paid days are not silently dropped.
     *
     * @return Collection<int, StorageFeeLog>
     */
    public function storageFeeLogsForCurrentAdmission()
    {
        $admissionStart = $this->currentAdmissionStart();

        if (! $admissionStart) {
            return collect();
        }

        return $this->storageFeeLogs->filter(function (StorageFeeLog $log) use ($admissionStart) {
            // No admission link yet (legacy row): treat as the current admission.
            if (! $log->admission_started_at) {
                return true;
            }

            return $log->admission_started_at->eq($admissionStart);
        });
    }

    /**
     * Get the total invoice amount (service invoices are lifetime; storage is
     * scoped to the current admission so re-admissions start a clean ledger).
     */
    public function getTotalBilledAttribute(): float
    {
        $serviceInvoiceTotal = $this->invoices->sum('total_amount');
        $storageInvoiceTotal = $this->storageFeeLogsForCurrentAdmission()->sum(function ($log) {
            return $log->invoice ? (float) $log->invoice->total_amount : 0.0;
        });

        return $serviceInvoiceTotal + $storageInvoiceTotal;
    }

    /**
     * Get the total deposits/payments made for this deceased person.
     *
     * General account credits (payments with no invoice) are lifetime — they
     * belong to the account, not a single admission — so they are always
     * counted. Payments attached to storage invoices are only counted when
     * that invoice belongs to the current admission.
     */
    public function getTotalPaidAttribute(): float
    {
        // General account credits (no invoice) are lifetime: they belong to the
        // account, not a single admission. Use the eager-loaded relation when
        // available, otherwise fall back to a single aggregate query.
        $allPayments = $this->relationLoaded('payments')
            ? $this->payments
            : $this->payments()->get();

        $generalCredits = $allPayments
            ->whereNull('invoice_id')
            ->sum(fn (Payment $p) => (float) $p->amount);

        // Payments attached to an invoice belong to that invoice's admission.
        // Service-invoice payments are lifetime (account-level); storage-invoice
        // payments count only when the invoice's admission matches the current
        // one. Reuse the loaded invoice + storageFeeLog relations so we do not
        // re-query on every accessor hit.
        $admissionStart = $this->currentAdmissionStart();

        $invoicePayments = $allPayments
            ->filter(fn (Payment $payment) => $payment->invoice_id !== null)
            ->sum(function (Payment $payment) use ($admissionStart) {
                $invoice = $payment->invoice;

                if (! $invoice) {
                    // Orphaned reference (invoice deleted): treat as a lifetime
                    // credit so we do not silently drop paid amounts.
                    return (float) $payment->amount;
                }

                if ($invoice->billing_type !== 'storage') {
                    // Service invoice: lifetime, not admission-scoped.
                    return (float) $payment->amount;
                }

                $log = $invoice->storageFeeLog?->first();

                // Legacy storage log without an admission link: count it.
                if (! $log || ! $log->admission_started_at) {
                    return (float) $payment->amount;
                }

                return ($admissionStart && $log->admission_started_at->eq($admissionStart))
                    ? (float) $payment->amount
                    : 0.0;
            });

        return $generalCredits + $invoicePayments;
    }

    /**
     * Get the total amount waived (service invoices are lifetime; storage is
     * scoped to the current admission).
     */
    public function getTotalWaivedAttribute(): float
    {
        $serviceWaived = $this->invoices->sum('waived_amount');
        $storageWaived = $this->storageFeeLogsForCurrentAdmission()->sum(function ($log) {
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
     * Check if storage days are fully paid *for the current admission*.
     */
    public function isStorageFullyPaid(): bool
    {
        return $this->days_paid >= $this->days_in_storage;
    }

    /**
     * Lifetime storage outstanding balance, summed across *all* admissions.
     *
     * Unlike the admission-scoped display ledger, this deliberately counts
     * every storage invoice the record has ever produced (billed/paid/waived)
     * plus general account credits. It is the figure the release gate should
     * use so that a body cannot be let out while any admission's storage debt
     * is still open — re-entering a settled body must not hide a new stay's
     * balance from the gate.
     *
     * Positive value means outstanding storage debt; zero means the storage
     * account is settled (any excess is covered by `lifetimeStorageSurplus`).
     */
    public function lifetimeStorageOutstanding(): float
    {
        $allLogs = $this->storageFeeLogs;

        $storageBilled = $allLogs->sum(fn (StorageFeeLog $log) => $log->invoice ? (float) $log->invoice->total_amount : 0.0);
        $storageWaived = $allLogs->sum(fn (StorageFeeLog $log) => $log->invoice ? (float) $log->invoice->waived_amount : 0.0);
        $storagePaid = $allLogs->sum(fn (StorageFeeLog $log) => $log->invoice ? (float) $log->invoice->paid_amount : 0.0);

        // General account credits can be applied to storage too.
        $generalCredits = $this->lifetimeGeneralCredits();

        return max(0.0, $storageBilled - $storagePaid - $storageWaived - $generalCredits);
    }

    /**
     * Lifetime general (unattached) wallet credits across the record.
     *
     * General credits are fungible: they offset storage debt and any excess
     * beyond the storage total is the refundable surplus.
     */
    public function lifetimeGeneralCredits(): float
    {
        return (float) $this->payments()
            ->whereNull('invoice_id')
            ->sum('amount');
    }

    /**
     * Lifetime storage surplus (excess owed back to the account on release).
     *
     * A positive value means the record is owed money — what was paid +
     * waived + credited exceeds what was actually billed across all storage
     * invoices. This is the refundable amount when a body is released with
     * money left over.
     */
    public function lifetimeStorageSurplus(): float
    {
        $allLogs = $this->storageFeeLogs;

        $storageBilled = $allLogs->sum(fn (StorageFeeLog $log) => $log->invoice ? (float) $log->invoice->total_amount : 0.0);
        $storageWaived = $allLogs->sum(fn (StorageFeeLog $log) => $log->invoice ? (float) $log->invoice->waived_amount : 0.0);
        $storagePaid = $allLogs->sum(fn (StorageFeeLog $log) => $log->invoice ? (float) $log->invoice->paid_amount : 0.0);

        $generalCredits = $this->lifetimeGeneralCredits();

        return max(0.0, ($storagePaid + $storageWaived + $generalCredits) - $storageBilled);
    }

    /**
     * Release gate: can this body be released without leaving storage debt
     * unpaid on *any* admission?
     *
     * Combines the admission-aware day check (the current stay must be fully
     * covered) with a lifetime check (no outstanding storage balance across the
     * record's whole history). A re-entered body with a settled prior admission
     * is only releasable once its *new* stay is billed+paid and no prior
     * admission still owes.
     */
    public function canReleaseStorage(): bool
    {
        if (! $this->isStorageFullyPaid()) {
            return false;
        }

        return $this->lifetimeStorageOutstanding() <= 0.0;
    }

    /**
     * Get the total days spent in storage for the *current* continuous admission.
     *
     * A chamber-to-chamber transfer does not restart the counter: it is still
     * the same admission, so days keep counting from the original entry. A full
     * release, however, ends the admission; if the body is later re-entered into
     * a chamber, the counter restarts from that new entry and the released gap
     * is not billed.
     */
    public function getDaysInStorageAttribute(): int
    {
        $entryAt = $this->currentAdmissionStart();

        if (! $entryAt) {
            return 0;
        }

        if ($this->status === 'Released' && $this->released_at) {
            return max(0, (int) $entryAt->diffInDays(Carbon::parse($this->released_at)));
        }

        return max(0, (int) $entryAt->diffInDays(now()));
    }

    /**
     * Resolve the start of the current continuous admission.
     *
     * A chamber-to-chamber transfer does not restart the admission; only a full
     * release does. After a release, the next `Entered` event (if any) starts a
     * fresh admission and the gap between them is not billed. Returns null when
     * there is no admission start, or the last state is a release with no
     * re-entry (the body is no longer in storage).
     */
    public function currentAdmissionStart(): ?Carbon
    {
        $transfers = $this->transfers()->get();

        $lastRelease = $transfers
            ->where('event_type', 'Released')
            ->max('transferred_at');

        if ($lastRelease) {
            $reEntry = $transfers
                ->where('event_type', 'Entered')
                ->where('transferred_at', '>', $lastRelease)
                ->min('transferred_at');

            // No re-entry after the release: the body is no longer in storage.
            return $reEntry !== null ? Carbon::parse($reEntry) : null;
        }

        $firstEntry = $transfers
            ->where('event_type', 'Entered')
            ->min('transferred_at');

        return $firstEntry !== null ? Carbon::parse($firstEntry) : null;
    }

    /**
     * Get the number of storage days paid for, scoped to the *current* admission.
     *
     * Each storage fee log records the admission it was billed under via its
     * `admission_started_at` timestamp. Only logs belonging to the current
     * admission are credited against this stay; paid days from a prior
     * admission (before a release) are not carried forward.
     */
    public function getDaysPaidAttribute(): int
    {
        $currentAdmissionLogs = $this->storageFeeLogsForCurrentAdmission();

        // No storage logs at all for this record: fall back to the main-invoice
        // proportional estimate.
        if ($this->storageFeeLogs->isEmpty()) {
            return $this->daysPaidFromMainInvoiceFallback();
        }

        // No active admission (released with no re-entry) or no storage logs
        // belonging to it: zero paid days count toward this stay. An empty
        // $currentAdmissionLogs already implies a null admission start, so no
        // extra transfers query is needed here.
        if ($currentAdmissionLogs->isEmpty()) {
            return 0;
        }

        $totalBilledDays = $currentAdmissionLogs->sum('days_billed');
        if ($totalBilledDays <= 0) {
            return 0;
        }

        $totalPaidAmount = $currentAdmissionLogs->sum(function ($log) {
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

    /**
     * Fallback paid-days estimate from the main service invoice (no storage logs).
     */
    private function daysPaidFromMainInvoiceFallback(): int
    {
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
