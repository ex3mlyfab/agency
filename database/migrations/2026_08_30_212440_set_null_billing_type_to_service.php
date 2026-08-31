<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('invoices')
            ->whereNull('billing_type')
            ->update(['billing_type' => 'service']);
    }

    public function down(): void
    {
        // Do not revert — this would break the data model.
        // Instead mark them as NULL if needed for rollback.
        DB::table('invoices')
            ->where('billing_type', 'service')
            ->update(['billing_type' => null]);
    }
};
