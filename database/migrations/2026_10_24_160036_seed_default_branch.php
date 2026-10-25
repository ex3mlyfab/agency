<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Seed the default "Main" branch and backfill existing chambers to it,
     * so pre-existing data keeps working under the new branch hierarchy.
     */
    public function up(): void
    {
        $branchId = (string) (DB::table('branches')->where('slug', 'main')->value('id')
            ?? Str::ulid());

        DB::table('branches')->updateOrInsert(
            ['slug' => 'main'],
            [
                'id' => $branchId,
                'name' => 'Main',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        DB::table('chambers')->whereNull('branch_id')->update(['branch_id' => $branchId]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $branchId = DB::table('branches')->where('slug', 'main')->value('id');

        if ($branchId) {
            DB::table('chambers')->where('branch_id', $branchId)->update(['branch_id' => null]);
            DB::table('branches')->where('id', $branchId)->delete();
        }
    }
};
