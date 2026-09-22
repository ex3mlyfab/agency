<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        Schema::create('activity_log', function (Blueprint $table) use ($isSqlite) {
            $table->id();
            $table->string('log_name')->nullable()->index();
            $table->text('description');

            if ($isSqlite) {
                // SQLite has no ALTER COLUMN; declare nullable ULID columns directly.
                $table->string('subject_type', 255)->nullable();
                $table->string('subject_id', 255)->nullable();
            } else {
                $table->nullableMorphs('subject', 'subject');
            }

            $table->string('event')->nullable();

            if ($isSqlite) {
                $table->string('causer_type', 255)->nullable();
                $table->string('causer_id', 255)->nullable();
            } else {
                $table->nullableMorphs('causer', 'causer');
            }

            $table->json('attribute_changes')->nullable();
            $table->json('properties')->nullable();
            $table->timestamps();
        });

        if (! $isSqlite) {
            // MySQL is strict about types, so we need to alter the morph columns
            // to accept string IDs (like ULIDs) instead of only bigint
            DB::statement('ALTER TABLE activity_log MODIFY COLUMN subject_id VARCHAR(26) NULL, MODIFY COLUMN causer_id VARCHAR(26) NULL');
        }
    }
};
