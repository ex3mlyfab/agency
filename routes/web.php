<?php

use App\Http\Controllers\ChamberController;
use App\Http\Controllers\ChamberHistoryController;
use App\Http\Controllers\DeceasedController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransferController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Deceased register
    Route::resource('deceased', DeceasedController::class);
    Route::get('deceased/{deceased}/release', [DeceasedController::class, 'showReleaseForm'])
        ->name('deceased.release-form');
    Route::post('deceased/{deceased}/release', [DeceasedController::class, 'release'])
        ->name('deceased.release');

    // Chambers CRUD + indicator index
    Route::resource('chambers', ChamberController::class)->except(['show']);

    // Chamber occupation history
    Route::get('chambers/{chamber}/history', [ChamberHistoryController::class, 'index'])
        ->name('chambers.history');

    // Transfers workflow
    Route::resource('transfers', TransferController::class)->only(['index', 'create', 'store']);

    // Reports
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('reports/generate', [ReportController::class, 'generate'])->name('reports.generate');
});

require __DIR__.'/settings.php';
