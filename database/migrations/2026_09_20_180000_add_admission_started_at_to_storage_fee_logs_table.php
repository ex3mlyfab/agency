<?php

use App\Models\Deceased;
use App\Models\StorageFeeLog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds an admission_started_at column so each storage fee log can be linked
     * to the continuous admission it was billed under. This lets days_paid
     * scope to the current admission instead of summing every log ever created.
     */
    public function up(): void
    {
        Schema::table('storage_fee_logs', function (Blueprint $table) {
            $table->timestamp('admission_started_at')->nullable()->after('created_by');
            $table->index(['deceased_id', 'admission_started_at']);
        });

        // Backfill: attribute each existing log to the admission it was billed
        // under. An admission is delimited by transfer events:
        // - No release before the log: it belongs to the earliest Entered.
        // - A release preceded it: it belongs to the most recent Entered that
        //   came after that release (a re-entry) and before the log was created.
        StorageFeeLog::query()
            ->whereNull('admission_started_at')
            ->with(['deceased'])
            ->each(function (StorageFeeLog $log): void {
                $deceased = $log->deceased;
                if (! $deceased) {
                    return;
                }

                $admissionStart = $this->resolveAdmissionStartForLog($deceased, $log->created_at);
                // Update the column directly so we don't re-trigger the model's
                // audit-logging side effects during a bulk backfill.
                $log->admission_started_at = $admissionStart;
                $log->save();
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storage_fee_logs', function (Blueprint $table) {
            $table->dropIndex(['deceased_id', 'admission_started_at']);
            $table->dropColumn('admission_started_at');
        });
    }

    /**
     * Resolve the admission a given log was billed under, using the log's
     * creation timestamp as the anchor.
     *
     * @param  Deceased  $deceased
     * @param  Carbon|null  $logCreatedAt
     */
    private function resolveAdmissionStartForLog($deceased, $logCreatedAt): ?Carbon
    {
        $transfers = $deceased->transfers()->get();

        $entries = $transfers->where('event_type', 'Entered');
        $releases = $transfers->where('event_type', 'Released');

        if ($releases->isEmpty()) {
            // No release ever: a single admission from the first entry.
            return $entries->first()?->transferred_at;
        }

        if (! $logCreatedAt) {
            return $entries->first()?->transferred_at;
        }

        // Find the most recent release strictly before this log was created.
        $lastReleaseBeforeLog = $releases
            ->filter(fn ($t) => $t->transferred_at->lt($logCreatedAt))
            ->max('transferred_at');

        if (! $lastReleaseBeforeLog) {
            return $entries->first()?->transferred_at;
        }

        // Re-entry after that release: the earliest Entered after the release
        // and no later than the log's creation.
        return $entries
            ->filter(fn ($t) => $t->transferred_at->gt($lastReleaseBeforeLog) && $t->transferred_at->lte($logCreatedAt))
            ->min('transferred_at')
            ?: $entries
                ->filter(fn ($t) => $t->transferred_at->gt($lastReleaseBeforeLog))
                ->min('transferred_at');
    }
};
