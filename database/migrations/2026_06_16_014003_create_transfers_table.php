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
        Schema::create('transfers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('deceased_id')->constrained('deceased')->cascadeOnDelete();
            $table->foreignUlid('from_chamber_id')->nullable()->constrained('chambers')->nullOnDelete();
            $table->foreignUlid('to_chamber_id')->nullable()->constrained('chambers')->nullOnDelete();
            $table->foreignUlid('transferred_by')->constrained('users')->cascadeOnDelete();
            $table->enum('event_type', ['Entered', 'Transferred', 'Released'])->default('Entered');
            $table->text('notes')->nullable();
            $table->timestamp('transferred_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
