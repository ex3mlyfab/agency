<?php

use App\Models\Branch;
use App\Models\Chamber;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'chambers.manage']);
    $role->givePermissionTo(['chambers.manage']);
    $this->superAdmin->assignRole($role);

    $this->branch = Branch::factory()->create();
});

it('rejects a chamber with the same name in the same branch', function () {
    Chamber::factory()->create(['name' => 'Cold Room 1', 'branch_id' => $this->branch->id]);

    $this->actingAs($this->superAdmin)
        ->post(route('chambers.store'), [
            'name' => 'Cold Room 1',
            'branch_id' => $this->branch->id,
        ])
        ->assertSessionHasErrors('name');
});

it('allows the same name in different branches', function () {
    Chamber::factory()->create(['name' => 'Cold Room 1', 'branch_id' => $this->branch->id]);
    $otherBranch = Branch::factory()->create();

    $this->actingAs($this->superAdmin)
        ->post(route('chambers.store'), [
            'name' => 'Cold Room 1',
            'branch_id' => $otherBranch->id,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseCount('chambers', 2);
});

it('rejects a duplicate unassigned chamber name', function () {
    Chamber::factory()->create(['name' => 'Freezer A', 'branch_id' => null]);

    $this->actingAs($this->superAdmin)
        ->post(route('chambers.store'), [
            'name' => 'Freezer A',
        ])
        ->assertSessionHasErrors('name');
});

it('allows updating a chamber without triggering its own uniqueness rule', function () {
    $chamber = Chamber::factory()->create(['name' => 'Old Name', 'branch_id' => $this->branch->id]);

    $this->actingAs($this->superAdmin)
        ->put(route('chambers.update', $chamber), [
            'name' => 'Old Name',
            'branch_id' => $this->branch->id,
        ])
        ->assertSessionHasNoErrors();
});

it('it rejects renaming a chamber onto another chamber in the same branch', function () {
    Chamber::factory()->create(['name' => 'Sibling', 'branch_id' => $this->branch->id]);
    $chamber = Chamber::factory()->create(['name' => 'Mine', 'branch_id' => $this->branch->id]);

    $this->actingAs($this->superAdmin)
        ->put(route('chambers.update', $chamber), [
            'name' => 'Sibling',
            'branch_id' => $this->branch->id,
        ])
        ->assertSessionHasErrors('name');
});
