<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('billing_type')->nullable()->after('status');
            $table->date('period_start_date')->nullable()->after('billing_type');
            $table->date('period_end_date')->nullable()->after('period_start_date');
            $table->index(['deceased_id', 'billing_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['deceased_id', 'billing_type']);
            $table->dropColumn(['billing_type', 'period_start_date', 'period_end_date']);
        });
    }
};
