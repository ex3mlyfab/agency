<?php

use App\Http\Controllers\ApplicationSettings\AuditController;
use App\Http\Controllers\ApplicationSettings\BrandingController;
use App\Http\Controllers\ApplicationSettings\PaymentModeController;
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
        Route::resource('users', UserController::class)->except(['show']);
        Route::resource('roles', RoleController::class)->except(['show']);
        Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::get('audits', [AuditController::class, 'index'])->name('audits.index');
        Route::get('branding', [BrandingController::class, 'edit'])->name('branding.edit');
        Route::post('branding', [BrandingController::class, 'update'])->name('branding.update');
        Route::resource('payment-modes', PaymentModeController::class);
    });
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
