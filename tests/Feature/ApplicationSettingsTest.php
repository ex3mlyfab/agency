<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

it('can access users settings index', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('application-settings.users.index'))
        ->assertOk();
});

it('can access roles settings index', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('application-settings.roles.index'))
        ->assertOk();
});

it('can access permissions settings index', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('application-settings.permissions.index'))
        ->assertOk();
});

it('can access audits settings index', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('application-settings.audits.index'))
        ->assertOk();
});

it('can access branding settings edit page', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('application-settings.branding.edit'))
        ->assertOk();
});

it('can update branding settings', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->post(route('application-settings.branding.update'), [
            'app_name' => 'Custom App Name',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('application_settings', [
        'key' => 'app_name',
        'value' => 'Custom App Name',
    ]);
});
