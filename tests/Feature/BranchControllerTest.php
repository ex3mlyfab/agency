<?php

use App\Models\Branch;
use App\Models\Chamber;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'branches.view']);
    Permission::firstOrCreate(['name' => 'branches.manage']);
    $role->givePermissionTo(['branches.view', 'branches.manage']);
    $this->superAdmin->assignRole($role);

    $this->user = User::factory()->create();
});

it('requires authentication to view branches', function () {
    $this->get(route('branches.index'))->assertRedirect(route('login'));
});

it('allows super admins to view branches', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('branches.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('branches/index'));
});

it('denies users without permission to view branches', function () {
    $this->actingAs($this->user)
        ->get(route('branches.index'))
        ->assertForbidden();
});

it('requires the manage permission to access the create form', function () {
    $this->actingAs($this->user)
        ->get(route('branches.create'))
        ->assertForbidden();

    Permission::firstOrCreate(['name' => 'branches.view']);
    $this->user->givePermissionTo('branches.view');

    $this->actingAs($this->user)
        ->get(route('branches.create'))
        ->assertForbidden();
});

it('can create a branch with an auto-generated slug', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('branches.store'), [
            'name' => 'Ikeja Branch',
            'status' => 'Active',
        ])
        ->assertRedirect(route('branches.index'));

    $this->assertDatabaseHas('branches', [
        'name' => 'Ikeja Branch',
        'slug' => 'ikeja-branch',
        'status' => 'Active',
    ]);
});

it('can create a branch with an explicit slug', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('branches.store'), [
            'name' => 'Lekki',
            'slug' => 'lkj',
            'status' => 'Active',
        ])
        ->assertRedirect(route('branches.index'));

    $this->assertDatabaseHas('branches', [
        'name' => 'Lekki',
        'slug' => 'lkj',
    ]);
});

it('rejects duplicate branch names', function () {
    Branch::factory()->create(['name' => 'Ikeja Branch', 'slug' => 'ikeja-branch']);

    $this->actingAs($this->superAdmin)
        ->post(route('branches.store'), [
            'name' => 'Ikeja Branch',
            'status' => 'Active',
        ])
        ->assertSessionHasErrors('name');
});

it('requires the manage permission to create branches', function () {
    $this->actingAs($this->user)
        ->post(route('branches.store'), [
            'name' => 'Ikeja Branch',
            'status' => 'Active',
        ])
        ->assertForbidden();
});

it('can update a branch', function () {
    $branch = Branch::factory()->create(['name' => 'Old Name', 'slug' => 'old-name']);

    $this->actingAs($this->superAdmin)
        ->put(route('branches.update', $branch), [
            'name' => 'New Name',
            'status' => 'Inactive',
        ])
        ->assertRedirect(route('branches.index'));

    $this->assertDatabaseHas('branches', [
        'id' => $branch->id,
        'name' => 'New Name',
        'slug' => 'new-name',
        'status' => 'Inactive',
    ]);
});

it('regenerates the slug when the name changes and no slug is supplied', function () {
    $branch = Branch::factory()->create(['name' => 'Ajah', 'slug' => 'ajah']);

    $this->actingAs($this->superAdmin)
        ->put(route('branches.update', $branch), [
            'name' => 'Ajah Phase 2',
            'slug' => '',
            'status' => 'Active',
        ])
        ->assertRedirect(route('branches.index'));

    expect($branch->fresh()->slug)->toBe('ajah-phase-2');
});

it('keeps the slug when one is explicitly supplied on update', function () {
    $branch = Branch::factory()->create(['name' => 'Apapa', 'slug' => 'apa']);

    $this->actingAs($this->superAdmin)
        ->put(route('branches.update', $branch), [
            'name' => 'Apapa Wharf',
            'slug' => 'apa',
            'status' => 'Active',
        ])
        ->assertRedirect(route('branches.index'));

    expect($branch->fresh()->slug)->toBe('apa');
});

it('cannot delete a branch that has chambers', function () {
    $branch = Branch::factory()->create(['slug' => 'ikeja']);
    Chamber::factory()->create(['branch_id' => $branch->id]);

    $this->actingAs($this->superAdmin)
        ->delete(route('branches.destroy', $branch))
        ->assertRedirect()
        ->assertSessionHas('flash.type', 'error');

    $this->assertDatabaseHas('branches', ['id' => $branch->id]);
});

it('can delete a branch without chambers', function () {
    $branch = Branch::factory()->create(['slug' => 'empty']);

    $this->actingAs($this->superAdmin)
        ->delete(route('branches.destroy', $branch))
        ->assertRedirect(route('branches.index'));

    $this->assertDatabaseMissing('branches', ['id' => $branch->id]);
});
