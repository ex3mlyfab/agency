<?php

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'deceased.view']);
    Permission::firstOrCreate(['name' => 'deceased.edit']);
    $role->givePermissionTo(['deceased.view', 'deceased.edit']);
    $this->superAdmin->assignRole($role);

    $this->user = User::factory()->create();
});

it('automatically generates a release code when a deceased record is created', function () {
    $deceased = Deceased::factory()->pending()->create([
        'release_code' => null,
    ]);

    expect($deceased->release_code)->not->toBeNull();
    expect($deceased->release_code)->toStartWith('DEC-');
    expect(strlen($deceased->release_code))->toBe(12); // 'DEC-' (4 chars) + 8 random chars
});

it('requires authentication to view release form', function () {
    $deceased = Deceased::factory()->pending()->create();

    $this->get(route('deceased.release-form', $deceased))
        ->assertRedirect(route('login'));
});

it('allows authorized users to view release form', function () {
    $deceased = Deceased::factory()->pending()->create();

    $this->actingAs($this->superAdmin)
        ->get(route('deceased.release-form', $deceased))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('deceased/release'));
});

it('fails release validation if release code is incorrect', function () {
    $deceased = Deceased::factory()->pending()->create();

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.release', $deceased), [
            'release_code' => 'INCORRECT_CODE',
            'released_to_name' => 'John Doe',
            'released_to_phone' => '123456789',
            'released_to_relationship' => 'Son',
            'released_to_id_type' => 'National ID',
            'released_to_id_number' => 'N12345',
            'confirm_physical_verification' => true,
        ])
        ->assertSessionHasErrors(['release_code']);
});

it('successfully releases deceased when correct code is provided', function () {
    $chamber = Chamber::factory()->create(['capacity' => 1]);
    $deceased = Deceased::factory()->create([
        'status' => 'InChamber',
        'chamber_id' => $chamber->id,
    ]);

    $releaseCode = $deceased->release_code;

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.release', $deceased), [
            'release_code' => $releaseCode,
            'released_to_name' => 'John Doe',
            'released_to_phone' => '123-456-7890',
            'released_to_relationship' => 'Son',
            'released_to_id_type' => 'Passport',
            'released_to_id_number' => 'P987654',
            'confirm_physical_verification' => true,
            'release_notes' => 'Handed over personal belongings.',
        ])
        ->assertRedirect(route('deceased.show', $deceased))
        ->assertSessionHas('flash.message', 'Deceased has been released successfully and chamber capacity updated.');

    // Refresh model and verify fields
    $deceased->refresh();
    expect($deceased->status)->toBe('Released');
    expect($deceased->chamber_id)->toBeNull();
    expect($deceased->released_to_name)->toBe('John Doe');
    expect($deceased->released_to_phone)->toBe('123-456-7890');
    expect($deceased->released_to_relationship)->toBe('Son');
    expect($deceased->released_to_id_type)->toBe('Passport');
    expect($deceased->released_to_id_number)->toBe('P987654');
    expect($deceased->released_at)->not->toBeNull();
    expect($deceased->released_by)->toBe($this->superAdmin->id);

    // Verify transfer history was logged
    $this->assertDatabaseHas('transfers', [
        'deceased_id' => $deceased->id,
        'from_chamber_id' => $chamber->id,
        'to_chamber_id' => null,
        'event_type' => 'Released',
        'notes' => 'Handed over personal belongings.',
    ]);
});
