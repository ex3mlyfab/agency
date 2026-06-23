<?php

use App\Models\Service;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'services.view']);
    Permission::firstOrCreate(['name' => 'services.manage']);
    $role->givePermissionTo(['services.view', 'services.manage']);
    $this->superAdmin->assignRole($role);

    $this->user = User::factory()->create();
});

it('requires authentication to view services', function () {
    $this->get(route('services.index'))->assertRedirect(route('login'));
});

it('allows super admins to view services', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('services.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('services/index'));
});

it('allows users with view permission to view services', function () {
    Permission::firstOrCreate(['name' => 'services.view']);
    $this->user->givePermissionTo('services.view');

    $this->actingAs($this->user)
        ->get(route('services.index'))
        ->assertOk();
});

it('denies users without permission to view services', function () {
    $this->actingAs($this->user)
        ->get(route('services.index'))
        ->assertForbidden();
});

it('can create a new service', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('services.store'), [
            'name' => 'Cremation',
            'description' => 'Complete cremation service package',
        ])
        ->assertRedirect(route('services.index'));

    $this->assertDatabaseHas('services', [
        'name' => 'Cremation',
        'description' => 'Complete cremation service package',
    ]);
});

it('can update a service', function () {
    $service = Service::factory()->create(['name' => 'Embalming']);

    $this->actingAs($this->superAdmin)
        ->put(route('services.update', $service), [
            'name' => 'Basic Embalming',
            'description' => 'Standard preservation service',
        ])
        ->assertRedirect(route('services.index'));

    $this->assertDatabaseHas('services', [
        'id' => $service->id,
        'name' => 'Basic Embalming',
    ]);
});

it('can delete a service', function () {
    $service = Service::factory()->create();

    $this->actingAs($this->superAdmin)
        ->delete(route('services.destroy', $service))
        ->assertRedirect(route('services.index'));

    $this->assertDatabaseMissing('services', [
        'id' => $service->id,
    ]);
});
