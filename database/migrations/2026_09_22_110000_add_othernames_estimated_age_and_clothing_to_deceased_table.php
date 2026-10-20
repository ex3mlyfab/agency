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
            $table->string('othernames')->nullable()->after('last_name');
            $table->unsignedInteger('estimated_age')->nullable()->after('date_of_birth');
            $table->text('residential_address')->nullable()->after('relative_address');
            $table->string('type_of_cloth')->nullable()->after('body_condition');
            $table->string('color_of_cloth')->nullable()->after('type_of_cloth');
            $table->string('underwear')->nullable()->after('color_of_cloth');
            $table->string('type_of_wrapping')->nullable()->after('underwear');
            $table->string('type_of_wrapping_other')->nullable()->after('type_of_wrapping');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deceased', function (Blueprint $table) {
            $table->dropColumn([
                'othernames',
                'estimated_age',
                'residential_address',
                'type_of_cloth',
                'color_of_cloth',
                'underwear',
                'type_of_wrapping',
                'type_of_wrapping_other',
            ]);
        });
    }
};
