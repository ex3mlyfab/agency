<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            'accounts.view',
            'service_categories.view',
            'service_categories.manage',
            'services.view',
            'services.manage',
            'service_prices.view',
            'service_prices.manage',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);
        }

        $superAdminRole = Role::where('name', 'super admin')->first();
        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($permissions);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissions = [
            'accounts.view',
            'service_categories.view',
            'service_categories.manage',
            'services.view',
            'services.manage',
            'service_prices.view',
            'service_prices.manage',
        ];

        $superAdminRole = Role::where('name', 'super admin')->first();
        if ($superAdminRole) {
            $superAdminRole->revokePermissionTo($permissions);
        }

        Permission::whereIn('name', $permissions)->delete();
    }
};
