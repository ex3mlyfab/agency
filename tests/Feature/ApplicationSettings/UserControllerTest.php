<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super admin']);
    Permission::firstOrCreate(['name' => 'users.view']);
    Permission::firstOrCreate(['name' => 'users.manage']);
    $role->givePermissionTo(['users.view', 'users.manage']);
    $this->superAdmin->assignRole($role);

    $this->viewer = User::factory()->create();
    $this->viewer->givePermissionTo('users.view');
});

it('lists users with summary stats for authorized users', function () {
    User::factory()->count(3)->create();
    User::factory()->unverified()->create();

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('application-settings/users/index')
            ->has('users.data')
            ->where('users.total', User::count())
            ->where('stats.total', User::count())
            ->where('stats.unverified', User::whereNull('email_verified_at')->count())
            ->where('stats.verified', User::whereNotNull('email_verified_at')->count())
            ->has('roles'));
});

it('forbids users without users.view permission', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('application-settings.users.index'))
        ->assertForbidden();
});

it('filters users by search query', function () {
    User::factory()->create(['name' => 'Alice Wonderland', 'email' => 'alice@example.com']);
    User::factory()->create(['name' => 'Bob Builder', 'email' => 'bob@example.com']);

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.users.index', ['search' => 'alice']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('users.total', 1)
            ->where('users.data.0.name', 'Alice Wonderland'));
});

it('filters users by role', function () {
    $editor = Role::firstOrCreate(['name' => 'editor']);
    User::factory()->create()->assignRole('super admin');
    User::factory()->create()->assignRole($editor);

    $expected = User::whereHas('roles', fn ($query) => $query->where('name', 'editor'))->count();

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.users.index', ['role' => 'editor']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('users.total', $expected));
});

it('filters users by email verification status', function () {
    User::factory()->unverified()->create();

    $expected = User::whereNull('email_verified_at')->count();

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.users.index', ['verified' => 'unverified']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('users.total', $expected));
});

it('filters users by creation date range', function () {
    User::factory()->create(['created_at' => now()->subMonths(2)]);
    User::factory()->create(['created_at' => now()->subDays(3)]);

    $from = now()->subWeek()->toDateString();
    $to = now()->toDateString();

    $expected = User::whereDate('created_at', '>=', $from)
        ->whereDate('created_at', '<=', $to)
        ->count();

    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.users.index', [
            'date_from' => $from,
            'date_to' => $to,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('users.total', $expected));
});
