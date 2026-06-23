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
        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropUnique(['service_id', 'service_category_id']);
            $table->string('source')->nullable()->after('service_category_id')->comment('In Hospital, Outside Hospital, or null for all');
            $table->unique(['service_id', 'service_category_id', 'source'], 'service_prices_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropUnique('service_prices_unique');
            $table->dropColumn(['source']);
            $table->unique(['service_id', 'service_category_id']);
        });
    }
};
