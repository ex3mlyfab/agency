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
        Schema::create('storage_fee_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('deceased_id')->constrained('deceased')->cascadeOnDelete();
            $table->foreignUlid('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->integer('days_billed');
            $table->integer('days_covered_from');
            $table->integer('days_covered_to');
            $table->decimal('amount', 12, 2);
            $table->integer('paid_days_at_creation');
            $table->foreignUlid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storage_fee_logs');
    }
};
