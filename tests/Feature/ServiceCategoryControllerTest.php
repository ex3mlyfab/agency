<?php

use App\Models\ServiceCategory;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'service_categories.view']);
    Permission::firstOrCreate(['name' => 'service_categories.manage']);
    $role->givePermissionTo(['service_categories.view', 'service_categories.manage']);
    $this->superAdmin->assignRole($role);

    $this->user = User::factory()->create();
});

it('requires authentication to view service categories', function () {
    $this->get(route('service-categories.index'))->assertRedirect(route('login'));
});

it('allows super admins to view service categories', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('service-categories.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('service-categories/index'));
});

it('allows users with view permission to view service categories', function () {
    Permission::firstOrCreate(['name' => 'service_categories.view']);
    $this->user->givePermissionTo('service_categories.view');

    $this->actingAs($this->user)
        ->get(route('service-categories.index'))
        ->assertOk();
});

it('denies users without permission to view service categories', function () {
    $this->actingAs($this->user)
        ->get(route('service-categories.index'))
        ->assertForbidden();
});

it('can create a new service category', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('service-categories.store'), [
            'name' => 'VIP Services',
            'description' => 'High priority premium services',
        ])
        ->assertRedirect(route('service-categories.index'));

    $this->assertDatabaseHas('service_categories', [
        'name' => 'VIP Services',
        'description' => 'High priority premium services',
    ]);
});

it('can update a service category', function () {
    $category = ServiceCategory::factory()->create(['name' => 'Standard Services']);

    $this->actingAs($this->superAdmin)
        ->put(route('service-categories.update', $category), [
            'name' => 'General Services',
            'description' => 'Basic standard offerings',
        ])
        ->assertRedirect(route('service-categories.index'));

    $this->assertDatabaseHas('service_categories', [
        'id' => $category->id,
        'name' => 'General Services',
    ]);
});

it('can delete a service category', function () {
    $category = ServiceCategory::factory()->create();

    $this->actingAs($this->superAdmin)
        ->delete(route('service-categories.destroy', $category))
        ->assertRedirect(route('service-categories.index'));

    $this->assertDatabaseMissing('service_categories', [
        'id' => $category->id,
    ]);
});
