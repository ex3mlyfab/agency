<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Permissions (keep aligned with frontend keys: history.view, reports.view)
        $permissions = [
            'dashboard.view',

            'history.view',
            'reports.view',

            // Deceased module (scaffolded pages exist)
            'deceased.view',
            'deceased.create',
            'deceased.edit',
            'deceased.delete',

            // Chambers module (future)
            'chambers.view',
            'chambers.manage',

            // Transfers / audit history
            'transfers.view',
            'transfers.create',

            // Settings (future)
            'settings.view',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);
        }

        // Role
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super admin'],
            ['guard_name' => 'web']
        );

        // Grant all known permissions to super admin
        $superAdminRole->syncPermissions(Permission::whereIn('name', $permissions)->pluck('name')->toArray());

        // Super admin user
        $email = env('ADMIN_EMAIL') ?: 'superadmin@example.com';
        $name = env('ADMIN_NAME') ?: 'Super Admin';

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(env('ADMIN_PASSWORD') ?: 'password'),
            ]
        );

        $user->assignRole($superAdminRole);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep it safe: don't hard-delete users/roles in a rollback.
        // Remove permissions and role if you truly want a clean rollback.
        $superAdminRole = Role::where('name', 'super admin')->first();
        if ($superAdminRole) {
            $superAdminRole->delete();
        }

        Permission::whereIn('name', [
            'dashboard.view',
            'history.view',
            'reports.view',
            'deceased.view',
            'deceased.create',
            'deceased.edit',
            'deceased.delete',
            'chambers.view',
            'chambers.manage',
            'transfers.view',
            'transfers.create',
            'settings.view',
        ])->delete();
    }
};
