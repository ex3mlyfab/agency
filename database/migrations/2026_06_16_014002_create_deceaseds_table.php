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
        Schema::create('deceased', function (Blueprint $table) {
            $table->ulid('id')->primary();

            // Deceased identity
            $table->string('first_name');
            $table->string('last_name');
            $table->date('date_of_birth')->nullable();
            $table->date('date_of_death');
            $table->enum('gender', ['Male', 'Female', 'Other'])->default('Male');
            $table->string('cause_of_death')->nullable();
            $table->text('notes')->nullable();

            // Status: Pending → InChamber → Released
            $table->enum('status', ['Pending', 'InChamber', 'Released'])->default('Pending');

            // Current chamber FK (nullable — no chamber when Pending/Released)
            $table->foreignUlid('chamber_id')->nullable()->constrained('chambers')->nullOnDelete();

            // Relative / bringer information
            $table->string('relative_name');
            $table->string('relative_phone');
            $table->string('relative_relationship');
            $table->string('relative_address')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deceased');
    }
};
