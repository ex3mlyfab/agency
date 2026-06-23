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
        Schema::table('deceased', function (Blueprint $table) {
            $table->foreignUlid('service_category_id')->nullable()->constrained('service_categories')->nullOnDelete();
            $table->string('source')->nullable()->comment('In Hospital, Outside Hospital');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deceased', function (Blueprint $table) {
            $table->dropForeign(['service_category_id']);
            $table->dropColumn(['service_category_id', 'source']);
        });
    }
};
