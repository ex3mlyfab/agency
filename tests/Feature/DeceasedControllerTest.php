<?php

use App\Models\Deceased;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'deceased.view']);
    Permission::firstOrCreate(['name' => 'deceased.create']);
    Permission::firstOrCreate(['name' => 'deceased.edit']);
    Permission::firstOrCreate(['name' => 'deceased.delete']);
    $role->givePermissionTo(['deceased.view', 'deceased.create', 'deceased.edit', 'deceased.delete']);
    $this->superAdmin->assignRole($role);

    $this->user = User::factory()->create();
});

it('requires authentication to view deceased register', function () {
    $this->get(route('deceased.index'))->assertRedirect(route('login'));
});

it('allows super admins to view deceased register', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('deceased.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('deceased/index'));
});

it('allows users with permission to view deceased register', function () {
    Permission::firstOrCreate(['name' => 'deceased.view']);
    $this->user->givePermissionTo('deceased.view');

    $this->actingAs($this->user)
        ->get(route('deceased.index'))
        ->assertOk();
});

it('denies users without permission to view deceased register', function () {
    $this->actingAs($this->user)
        ->get(route('deceased.index'))
        ->assertForbidden();
});

it('can create a new deceased record', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'date_of_death' => now()->format('Y-m-d'),
            'gender' => 'Male',
            'relative_name' => 'Jane Doe',
            'relative_phone' => '555-1234',
            'relative_relationship' => 'Spouse',
        ])
        ->assertRedirect(route('deceased.index'));

    $this->assertDatabaseHas('deceased', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'status' => 'Pending',
    ]);
});

it('can update a deceased record', function () {
    $deceased = Deceased::factory()->create();

    $this->actingAs($this->superAdmin)
        ->put(route('deceased.update', $deceased), [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'date_of_death' => now()->format('Y-m-d'),
            'gender' => 'Female',
            'relative_name' => 'John Smith',
            'relative_phone' => '555-4321',
            'relative_relationship' => 'Spouse',
        ])
        ->assertRedirect(route('deceased.show', $deceased));

    $this->assertDatabaseHas('deceased', [
        'id' => $deceased->id,
        'first_name' => 'Jane',
        'last_name' => 'Smith',
    ]);
});

it('can delete a deceased record', function () {
    $deceased = Deceased::factory()->create();

    $this->actingAs($this->superAdmin)
        ->delete(route('deceased.destroy', $deceased))
        ->assertRedirect(route('deceased.index'));

    $this->assertDatabaseMissing('deceased', [
        'id' => $deceased->id,
    ]);
});
