<?php

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'service_prices.view']);
    Permission::firstOrCreate(['name' => 'service_prices.manage']);
    $role->givePermissionTo(['service_prices.view', 'service_prices.manage']);
    $this->superAdmin->assignRole($role);

    $this->user = User::factory()->create();
});

it('requires authentication to view service prices', function () {
    $this->get(route('service-prices.index'))->assertRedirect(route('login'));
});

it('allows super admins to view service prices', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('service-prices.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('service-prices/index'));
});

it('allows users with view permission to view service prices', function () {
    Permission::firstOrCreate(['name' => 'service_prices.view']);
    $this->user->givePermissionTo('service_prices.view');

    $this->actingAs($this->user)
        ->get(route('service-prices.index'))
        ->assertOk();
});

it('denies users without permission to view service prices', function () {
    $this->actingAs($this->user)
        ->get(route('service-prices.index'))
        ->assertForbidden();
});

it('can create a new service price configuration with tiers', function () {
    $service = Service::factory()->create();
    $category = ServiceCategory::factory()->create();

    $this->actingAs($this->superAdmin)
        ->post(route('service-prices.store'), [
            'service_id' => $service->id,
            'service_category_id' => $category->id,
            'price' => '250.00',
            'tiers' => [
                ['start_day' => 1, 'end_day' => 5, 'price' => '10.00'],
                ['start_day' => 6, 'end_day' => null, 'price' => '15.00'],
            ],
        ])
        ->assertRedirect(route('service-prices.index'));

    $this->assertDatabaseHas('service_prices', [
        'service_id' => $service->id,
        'service_category_id' => $category->id,
        'price' => '250.00',
    ]);

    $this->assertDatabaseHas('service_price_tiers', [
        'start_day' => 1,
        'end_day' => 5,
        'price' => '10.00',
    ]);

    $this->assertDatabaseHas('service_price_tiers', [
        'start_day' => 6,
        'end_day' => null,
        'price' => '15.00',
    ]);
});

it('can update a service price configuration and sync tiers', function () {
    $servicePrice = ServicePrice::factory()->create(['price' => '100.00']);
    $service = Service::factory()->create();
    $category = ServiceCategory::factory()->create();

    $servicePrice->servicePriceTiers()->create([
        'start_day' => 1,
        'end_day' => 10,
        'price' => '8.00',
    ]);

    $this->actingAs($this->superAdmin)
        ->put(route('service-prices.update', $servicePrice), [
            'service_id' => $service->id,
            'service_category_id' => $category->id,
            'price' => '150.00',
            'tiers' => [
                ['start_day' => 1, 'end_day' => 5, 'price' => '12.00'],
            ],
        ])
        ->assertRedirect(route('service-prices.index'));

    $this->assertDatabaseHas('service_prices', [
        'id' => $servicePrice->id,
        'service_id' => $service->id,
        'service_category_id' => $category->id,
        'price' => '150.00',
    ]);

    $this->assertDatabaseMissing('service_price_tiers', [
        'price' => '8.00',
    ]);

    $this->assertDatabaseHas('service_price_tiers', [
        'service_price_id' => $servicePrice->id,
        'start_day' => 1,
        'end_day' => 5,
        'price' => '12.00',
    ]);
});

it('can delete a service price configuration', function () {
    $servicePrice = ServicePrice::factory()->create();

    $this->actingAs($this->superAdmin)
        ->delete(route('service-prices.destroy', $servicePrice))
        ->assertRedirect(route('service-prices.index'));

    $this->assertDatabaseMissing('service_prices', [
        'id' => $servicePrice->id,
    ]);
});
