<?php

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Service;
use App\Models\ServiceCategory;
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
    $this->category = ServiceCategory::factory()->create();
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
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
        ])
        ->assertRedirect(route('deceased.index'));

    $this->assertDatabaseHas('deceased', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'status' => 'Pending',
        'service_category_id' => $this->category->id,
        'source' => 'In Hospital',
    ]);
});

it('stores the new deceased profile and clothing fields', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'othernames' => 'Johnny',
            'estimated_age' => 67,
            'date_of_death' => now()->format('Y-m-d'),
            'body_condition' => 'Fresh',
            'type_of_cloth' => 'Sheet',
            'color_of_cloth' => 'White',
            'underwear' => 'Linen',
            'type_of_wrapping' => 'Bed Spread',
            'gender' => 'Male',
            'relative_name' => 'Jane Doe',
            'relative_phone' => '555-1234',
            'relative_relationship' => 'Spouse',
            'relative_address' => '123 High St',
            'residential_address' => "456 Old Town\nDistrict B",
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
        ])
        ->assertRedirect(route('deceased.index'));

    $this->assertDatabaseHas('deceased', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'othernames' => 'Johnny',
        'estimated_age' => 67,
        'type_of_cloth' => 'Sheet',
        'color_of_cloth' => 'White',
        'underwear' => 'Linen',
        'type_of_wrapping' => 'Bed Spread',
        'type_of_wrapping_other' => null,
        'relative_address' => '123 High St',
        'residential_address' => "456 Old Town\nDistrict B",
    ]);
});

it('requires the wrapping specification when wrapping type is others', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'date_of_death' => now()->format('Y-m-d'),
            'gender' => 'Male',
            'type_of_wrapping' => 'Others',
            'relative_name' => 'Jane Doe',
            'relative_phone' => '555-1234',
            'relative_relationship' => 'Spouse',
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
        ])
        ->assertSessionHasErrors('type_of_wrapping_other');

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'date_of_death' => now()->format('Y-m-d'),
            'gender' => 'Male',
            'type_of_wrapping' => 'Others',
            'type_of_wrapping_other' => 'Custom shroud',
            'relative_name' => 'Jane Doe',
            'relative_phone' => '555-1234',
            'relative_relationship' => 'Spouse',
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
        ])
        ->assertRedirect(route('deceased.index'));

    $this->assertDatabaseHas('deceased', [
        'first_name' => 'John',
        'type_of_wrapping' => 'Others',
        'type_of_wrapping_other' => 'Custom shroud',
    ]);
});

it('rejects an out of range estimated age', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'estimated_age' => 200,
            'date_of_death' => now()->format('Y-m-d'),
            'gender' => 'Male',
            'relative_name' => 'Jane Doe',
            'relative_phone' => '555-1234',
            'relative_relationship' => 'Spouse',
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
        ])
        ->assertSessionHasErrors('estimated_age');
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
            'service_category_id' => $this->category->id,
            'source' => 'Outside Hospital',
        ])
        ->assertRedirect(route('deceased.show', $deceased));

    $this->assertDatabaseHas('deceased', [
        'id' => $deceased->id,
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'service_category_id' => $this->category->id,
        'source' => 'Outside Hospital',
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

it('renders the print page for a deceased record', function () {
    $deceased = Deceased::factory()->create();

    $this->actingAs($this->superAdmin)
        ->get(route('deceased.print', $deceased))
        ->assertOk()
        ->assertViewIs('deceased-print')
        ->assertViewHas('deceased', $deceased);
});

it('denies unauthenticated users from accessing the print page', function () {
    $deceased = Deceased::factory()->create();

    $this->get(route('deceased.print', $deceased))
        ->assertRedirect(route('login'));
});

it('rejects storing a deceased into a chamber that is at capacity', function () {
    $chamber = Chamber::factory()->create(['capacity' => 1]);
    Deceased::factory()->create(['status' => 'InChamber', 'chamber_id' => $chamber->id]);

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'Full',
            'last_name' => 'House',
            'date_of_death' => now()->format('Y-m-d'),
            'gender' => 'Male',
            'relative_name' => 'Jane Doe',
            'relative_phone' => '555-1234',
            'relative_relationship' => 'Spouse',
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
            'chamber_id' => $chamber->id,
            'stored_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors(['chamber_id']);

    $this->assertDatabaseMissing('deceased', ['first_name' => 'Full', 'last_name' => 'House']);
    $this->assertDatabaseMissing('transfers', ['to_chamber_id' => $chamber->id, 'event_type' => 'Entered']);
});

it('accepts storing a deceased into a chamber with free space', function () {
    $chamber = Chamber::factory()->create(['capacity' => 1]);

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'Space',
            'last_name' => 'Available',
            'date_of_death' => now()->format('Y-m-d'),
            'gender' => 'Male',
            'relative_name' => 'Jane Doe',
            'relative_phone' => '555-1234',
            'relative_relationship' => 'Spouse',
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
            'chamber_id' => $chamber->id,
            'stored_at' => now()->toDateTimeString(),
        ])
        ->assertRedirect(route('deceased.index'));

    $this->assertDatabaseHas('transfers', ['to_chamber_id' => $chamber->id, 'event_type' => 'Entered']);
});

it('rejects transferring a deceased into a full chamber via edit', function () {
    $fullChamber = Chamber::factory()->create(['capacity' => 1]);
    Deceased::factory()->create(['status' => 'InChamber', 'chamber_id' => $fullChamber->id]);

    $moving = Deceased::factory()->create(['status' => 'InChamber']);

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.update', $moving), [
            '_method' => 'PUT',
            'first_name' => $moving->first_name,
            'last_name' => $moving->last_name,
            'date_of_death' => $moving->date_of_death->format('Y-m-d'),
            'gender' => $moving->gender,
            'relative_name' => $moving->relative_name,
            'relative_phone' => $moving->relative_phone,
            'relative_relationship' => $moving->relative_relationship,
            'service_category_id' => $moving->service_category_id,
            'source' => $moving->source,
            'chamber_id' => $fullChamber->id,
            'stored_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors(['chamber_id']);

    $moving->refresh();

    expect($moving->chamber_id)->toBeNull();

    $this->assertDatabaseMissing('transfers', ['deceased_id' => $moving->id, 'event_type' => 'Transferred']);
});

it('rejects saving a service invoice when no price is configured for a selected service', function () {
    $service = Service::create(['name' => 'Unpriced Service']);

    $deceased = Deceased::factory()->pending()->create(['service_category_id' => $this->category->id]);

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.invoice.save', $deceased), [
            'items' => [
                ['service_id' => $service->id, 'quantity' => 2],
            ],
        ])
        ->assertSessionHasErrors(['items']);

    $this->assertDatabaseMissing('invoice_items', ['service_id' => $service->id]);
});
