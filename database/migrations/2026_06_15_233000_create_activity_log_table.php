<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->string('log_name')->nullable()->index();
            $table->text('description');
            $table->nullableMorphs('subject', 'subject');
            $table->string('event')->nullable();
            $table->nullableMorphs('causer', 'causer');
            $table->json('attribute_changes')->nullable();
            $table->json('properties')->nullable();
            $table->timestamps();
        });

        // Fix: MySQL is strict about types, so we need to alter the morph columns
        // to accept string IDs (like ULIDs) instead of only bigint
        DB::statement('ALTER TABLE activity_log MODIFY COLUMN subject_id VARCHAR(26) NULL, MODIFY COLUMN causer_id VARCHAR(26) NULL');
    }
};
