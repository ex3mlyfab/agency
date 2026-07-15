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
        Schema::table('deceased', function (Blueprint $table): void {
            $table->index('status');
        });

        Schema::table('transfers', function (Blueprint $table): void {
            $table->index(['event_type', 'transferred_at']);
        });

        foreach (['payment-modes.view', 'payment-modes.manage', 'branding.manage', 'audits.view'] as $permission) {
            DB::table('permissions')->insertOrIgnore([
                'name' => $permission, 'guard_name' => 'web',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deceased', function (Blueprint $table): void {
            $table->dropIndex(['status']);
        });

        Schema::table('transfers', function (Blueprint $table): void {
            $table->dropIndex(['event_type', 'transferred_at']);
        });

        DB::table('permissions')->whereIn('name', ['payment-modes.view', 'payment-modes.manage', 'branding.manage', 'audits.view'])->delete();
    }
};
