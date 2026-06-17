<?php

use App\Http\Controllers\ApplicationSettings\AuditController;
use App\Http\Controllers\ApplicationSettings\BrandingController;
use App\Http\Controllers\ApplicationSettings\PermissionController;
use App\Http\Controllers\ApplicationSettings\RoleController;
use App\Http\Controllers\ApplicationSettings\UserController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    // Application Settings
    Route::group(['prefix' => 'settings/application-settings', 'as' => 'application-settings.'], function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::get('audits', [AuditController::class, 'index'])->name('audits.index');
        Route::get('branding', [BrandingController::class, 'edit'])->name('branding.edit');
        Route::post('branding', [BrandingController::class, 'update'])->name('branding.update');
    });
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
