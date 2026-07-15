<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

it('forbids unprivileged users from application settings', function () {
    $user = User::factory()->create();

    actingAs($user)->get(route('application-settings.users.index'))->assertForbidden();
    actingAs($user)->get(route('application-settings.roles.index'))->assertForbidden();
    actingAs($user)->get(route('application-settings.permissions.index'))->assertForbidden();
    actingAs($user)->get(route('application-settings.audits.index'))->assertForbidden();
    actingAs($user)->get(route('application-settings.branding.edit'))->assertForbidden();
    actingAs($user)->post(route('application-settings.branding.update'), [
        'app_name' => 'Custom App Name',
        'currency_symbol' => '$',
    ])->assertForbidden();
});
