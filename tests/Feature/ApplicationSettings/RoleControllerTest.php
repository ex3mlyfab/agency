<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super admin']);
    Permission::firstOrCreate(['name' => 'roles.view']);
    Permission::firstOrCreate(['name' => 'roles.manage']);
    $role->givePermissionTo(['roles.view', 'roles.manage']);
    $this->superAdmin->assignRole($role);

    $this->viewer = User::factory()->create();
    $this->viewer->givePermissionTo('roles.view');
});

it('lists roles with summary stats for authorized users', function () {
    Role::create(['name' => 'Manager', 'guard_name' => 'web']);
    Role::create(['name' => 'Receptionist', 'guard_name' => 'web']);

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.roles.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('application-settings/roles/index')
            ->has('roles.data')
            ->where('roles.total', Role::count())
            ->where('summary.total_roles', Role::count())
            ->where('summary.total_permissions', Permission::count())
            ->has('guards'));
});

it('forbids users without roles.view permission', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('application-settings.roles.index'))
        ->assertForbidden();
});

it('filters roles by search query', function () {
    Role::create(['name' => 'Manager', 'guard_name' => 'web']);
    Role::create(['name' => 'Receptionist', 'guard_name' => 'web']);

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.roles.index', ['search' => 'Manager']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('roles.total', 1)
            ->where('roles.data.0.name', 'Manager'));
});

it('filters roles by date range', function () {
    $oldRole = Role::create(['name' => 'Old Role', 'guard_name' => 'web', 'created_at' => now()->subDays(60)]);
    $newRole = Role::create(['name' => 'New Role', 'guard_name' => 'web', 'created_at' => now()->subDays(5)]);

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.roles.index', [
            'date_from' => now()->subDays(10)->toDateString(),
            'date_to' => now()->toDateString(),
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('roles.total', 2)
            ->where('roles.data', fn ($data) => collect($data)->pluck('id')->contains($newRole->id)));
});

it('filters roles by guard name', function () {
    $webRole = Role::create(['name' => 'Web Role', 'guard_name' => 'web']);
    Role::create(['name' => 'Api Role', 'guard_name' => 'api']);

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.roles.index', ['guard_name' => 'web']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('roles.total', 2)
            ->where('roles.data.0.guard_name', 'web'));
});
