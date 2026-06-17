<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('deceased', function (Blueprint $table) {
            $table->string('release_code')->nullable()->unique()->after('status');
            $table->string('released_to_name')->nullable();
            $table->string('released_to_phone')->nullable();
            $table->string('released_to_relationship')->nullable();
            $table->string('released_to_id_type')->nullable();
            $table->string('released_to_id_number')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->foreignUlid('released_by')->nullable()->constrained('users')->nullOnDelete();
        });

        // Generate release codes for existing records
        DB::table('deceased')->whereNull('release_code')->get()->each(function ($deceased) {
            DB::table('deceased')->where('id', $deceased->id)->update([
                'release_code' => 'DEC-'.strtoupper(Str::random(8)),
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deceased', function (Blueprint $table) {
            $table->dropForeign(['released_by']);
            $table->dropColumn([
                'release_code',
                'released_to_name',
                'released_to_phone',
                'released_to_relationship',
                'released_to_id_type',
                'released_to_id_number',
                'released_at',
                'released_by',
            ]);
        });
    }
};
