<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * All permissions aggregated from migrations and used throughout the application.
     *
     * @var list<string>
     */
    protected array $permissions = [
        // Dashboard & navigation
        'dashboard.view',

        // History & reports
        'history.view',
        'reports.view',

        // Deceased management
        'deceased.view',
        'deceased.create',
        'deceased.edit',
        'deceased.delete',
        'deceased.bypass-billing',

        // Chambers
        'chambers.view',
        'chambers.manage',

        // Transfers
        'transfers.view',
        'transfers.create',

        // Accounts & services
        'accounts.view',
        'service_categories.view',
        'service_categories.manage',
        'services.view',
        'services.manage',
        'service_prices.view',
        'service_prices.manage',

        // Billing & payments
        'invoices.view',
        'invoices.manage',
        'payments.view',
        'payments.manage',
        'payment-modes.view',
        'payment-modes.manage',

        // Storage & invoices
        'storage.invoices.view',
        'storage.invoices.manage',

        // Waivers
        'waivers.view',
        'waivers.manage',

        // User & role management
        'users.view',
        'users.manage',
        'roles.view',
        'roles.manage',
        'permissions.view',

        // Settings & administration
        'settings.view',
        'branding.manage',
        'audits.view',
    ];

    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        foreach ($this->permissions as $permissionName) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $permissionName, 'guard_name' => 'web'],
                ['name' => $permissionName, 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $superAdminRole = Role::where('name', 'super admin')->first();
        if ($superAdminRole) {
            $superAdminRole->syncPermissions($this->permissions);
        }
    }
}
