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

        if (! Schema::hasColumn('service_prices', 'source')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->string('source')->nullable()->after('service_category_id')->comment('In Hospital, Outside Hospital, or null for all');
            });
        }

        if ($isSqlite) {
            if (! Schema::hasIndex('service_prices', 'service_prices_service_category_source_index')) {
                DB::statement('CREATE INDEX service_prices_service_category_source_index ON service_prices (service_id, service_category_id, source)');
            }

            DB::statement('DROP INDEX IF EXISTS service_prices_service_id_service_category_id_unique');

            return;
        }

        if (! Schema::hasIndex('service_prices', 'service_prices_service_category_source_index')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->index(['service_id', 'service_category_id', 'source'], 'service_prices_service_category_source_index');
            });
        }

        if (Schema::hasIndex('service_prices', 'service_prices_service_id_service_category_id_unique')) {
            DB::statement('ALTER TABLE service_prices DROP INDEX service_prices_service_id_service_category_id_unique');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasIndex('service_prices', 'service_prices_service_id_service_category_id_unique')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->unique(['service_id', 'service_category_id']);
            });
        }

        if (Schema::hasIndex('service_prices', 'service_prices_service_category_source_index')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->dropIndex('service_prices_service_category_source_index');
            });
        }

        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
