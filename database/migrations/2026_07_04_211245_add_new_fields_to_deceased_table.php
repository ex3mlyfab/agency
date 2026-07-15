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
            $table->string('body_tag_number')->nullable();
            $table->string('body_condition')->nullable();
            $table->string('place_of_death')->nullable();
            $table->string('hospital_number')->nullable();
            $table->dateTime('date_of_death')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deceased', function (Blueprint $table) {
            $table->dropColumn([
                'body_tag_number',
                'body_condition',
                'place_of_death',
                'hospital_number',
            ]);
            $table->date('date_of_death')->change();
        });
    }
};
