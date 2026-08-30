<?php

use App\Http\Controllers\ChamberController;
use App\Http\Controllers\ChamberHistoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeceasedController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServicePriceController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\WaiverController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Deceased register
    Route::resource('deceased', DeceasedController::class);
    Route::get('deceased/{deceased}/release', [DeceasedController::class, 'showReleaseForm'])
        ->name('deceased.show-release');
    Route::post('deceased/{deceased}/release', [DeceasedController::class, 'release'])
        ->name('deceased.release');
    Route::post('deceased/{deceased}/invoice', [DeceasedController::class, 'saveInvoice'])
        ->name('deceased.invoice.save');
    Route::post('deceased/{deceased}/storage-invoice', [DeceasedController::class, 'generateStorageInvoice'])
        ->name('deceased.storage-invoice.generate');

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

    // Accounts / Services Module
    Route::resource('service-categories', ServiceCategoryController::class);
    Route::resource('services', ServiceController::class);
    Route::resource('service-prices', ServicePriceController::class);

    // Billing
    Route::resource('invoices', InvoiceController::class)->only(['index', 'show']);
    Route::resource('payments', PaymentController::class)->only(['index', 'show', 'store']);
    Route::post('payments/apply-wallet-to-invoice', [PaymentController::class, 'applyWalletToInvoice'])
        ->name('payments.apply-wallet-to-invoice');
    Route::resource('waivers', WaiverController::class)->only(['index', 'show', 'store', 'create']);
});

require __DIR__.'/settings.php';
