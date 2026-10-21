<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;

it('assigns the super admin role to the test user', function () {
    $this->seed(DatabaseSeeder::class);

    $testUser = User::where('email', 'test@example.com')->firstOrFail();

    expect($testUser->hasRole('super admin'))->toBeTrue();
});
