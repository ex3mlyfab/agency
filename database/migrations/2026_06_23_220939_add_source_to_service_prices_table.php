<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        Schema::table('service_prices', function (Blueprint $table) {
            $table->string('source')->nullable()->after('service_category_id')->comment('In Hospital, Outside Hospital, or null for all');
        });

        if ($isSqlite) {
            // SQLite cannot widen a unique index in place. Drop the legacy
            // (service_id, service_category_id) unique index by its exact name
            // and replace it with a non-unique index that also includes source,
            // so multiple source-specific price rows can coexist per service.
            DB::statement('DROP INDEX IF EXISTS service_prices_service_id_service_category_id_unique');
            DB::statement('CREATE INDEX service_prices_service_category_source_index ON service_prices (service_id, service_category_id, source)');

            return;
        }

        DB::statement('ALTER TABLE service_prices DROP INDEX service_prices_service_id_service_category_id_unique');
        Schema::table('service_prices', function (Blueprint $table) {
            $table->index(['service_id', 'service_category_id', 'source']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
