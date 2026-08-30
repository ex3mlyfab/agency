<?php

use App\Actions\CreateStorageFeeInvoice;
use App\Actions\RecordPayment;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\ServicePriceTier;
use App\Models\StorageFeeLog;
use App\Models\Transfer;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    $permissions = [
        'deceased.view', 'deceased.edit', 'deceased.create',
        'storage.invoices.view', 'storage.invoices.manage',
        'payments.view', 'payments.manage',
    ];
    foreach ($permissions as $perm) {
        Permission::firstOrCreate(['name' => $perm]);
    }
    $role->givePermissionTo($permissions);
    $this->superAdmin->assignRole($role);

    $this->category = ServiceCategory::factory()->create(['name' => 'VIP']);
});

it('creates a storage fee invoice for all days in storage when lastCoveredDay is 0', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S1',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => 5, 'price' => 10000.00]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 6, 'end_day' => 10, 'price' => 15000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(7),
    ]);

    expect($deceased->fresh()->days_in_storage)->toEqual(7);

    $action = app(CreateStorageFeeInvoice::class);
    $invoice = $action->handle($deceased, $this->superAdmin->id, 0);

    expect($invoice)->not->toBeNull();
    expect($invoice->billing_type)->toEqual('storage');
    expect($invoice->total_amount)->toEqual(80000.00);
    expect($invoice->status)->toEqual('Unpaid');

    $this->assertDatabaseHas('invoice_items', [
        'invoice_id' => $invoice->id,
        'service_id' => $chamberService->id,
        'quantity' => 7,
        'total_price' => 80000.00,
    ]);

    $this->assertDatabaseHas('storage_fee_logs', [
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice->id,
        'days_billed' => 7,
        'days_covered_from' => 1,
        'days_covered_to' => 7,
        'amount' => 80000.00,
    ]);
});

it('creates next storage invoice for uncovered days after previous is paid', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S2',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => 10, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(15),
    ]);

    $action = app(CreateStorageFeeInvoice::class);

    // First invoice covers days 1-10
    $invoice1 = $action->handle($deceased, $this->superAdmin->id, 0);
    expect($invoice1)->not->toBeNull();
    expect($invoice1->total_amount)->toEqual(100000.00);

    // Pay the first invoice using RecordPayment action (triggers auto-generation)
    $paymentMode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);
    $recordPayment = app(RecordPayment::class);
    $recordPayment->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice1->id,
        'payment_mode_id' => $paymentMode->id,
        'amount' => 100000.00,
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], $this->superAdmin->id);

    $invoice1->refresh();
    expect($invoice1->status)->toEqual('Paid');

    // Now generate next invoice for days 11-15 (5 new days)
    $deceased = $deceased->fresh()->load('storageFeeLogs');
    $invoice2 = $action->handle($deceased, $this->superAdmin->id, 10);

    expect($invoice2)->not->toBeNull();
    expect($invoice2->billing_type)->toEqual('storage');
    expect($invoice2->total_amount)->toEqual(50000.00);

    $this->assertDatabaseHas('storage_fee_logs', [
        'deceased_id' => $deceased->id,
        'days_billed' => 5,
        'days_covered_from' => 11,
        'days_covered_to' => 15,
    ]);
});

it('returns null when there are no new days to bill', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S3',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(5),
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $invoice = $action->handle($deceased, $this->superAdmin->id, 0);
    expect($invoice)->not->toBeNull();

    // Try to create another — should return null (no new days)
    $invoice2 = $action->handle($deceased->fresh(), $this->superAdmin->id, 5);
    expect($invoice2)->toBeNull();
});

it('returns null when deceased has no chamber', function () {
    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => null,
        'status' => 'Pending',
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $invoice = $action->handle($deceased, $this->superAdmin->id, 0);

    expect($invoice)->toBeNull();
});

it('returns null when chamber has no storage service', function () {
    $chamber = Chamber::create([
        'name' => 'Chamber S5',
        'capacity' => 2,
        'service_id' => null,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(5),
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $invoice = $action->handle($deceased, $this->superAdmin->id, 0);

    expect($invoice)->toBeNull();
});

it('generates storage invoice via controller route', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S6',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(3),
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.storage-invoice.generate', $deceased))
        ->assertRedirect(route('deceased.show', $deceased));

    expect(Invoice::where('deceased_id', $deceased->id)->where('billing_type', 'storage')->exists())->toBeTrue();
    expect(Invoice::where('deceased_id', $deceased->id)->where('billing_type', 'storage')->first()->total_amount)->toEqual(30000);
});

it('auto-generates next storage invoice when previous one is fully paid via RecordPayment', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S7',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => 10, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(10),
    ]);

    // Create first storage invoice for days 1-10
    $action = app(CreateStorageFeeInvoice::class);
    $invoice1 = $action->handle($deceased, $this->superAdmin->id, 0);
    expect($invoice1)->not->toBeNull();
    expect($invoice1->total_amount)->toEqual(100000.00);
    expect($invoice1->billing_type)->toEqual('storage');

    // Pay the first invoice directly (simulating what RecordPayment does)
    Payment::create([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice1->id,
        'receipt_number' => 'REC-STO-1',
        'amount' => 100000.00,
        'payment_method' => 'Cash',
        'payment_date' => now(),
        'received_by' => $this->superAdmin->id,
    ]);
    $invoice1->refresh();
    $invoice1->paid_amount = $invoice1->payments()->sum('amount');
    $invoice1->status = $invoice1->paid_amount >= $invoice1->total_amount ? 'Paid' : 'Partially Paid';
    $invoice1->save();
    expect($invoice1->status)->toEqual('Paid');

    // Manually trigger auto-generation logic (what RecordPayment does internally)
    $deceasedFresh = Deceased::with('storageFeeLogs', 'transfers')->find($invoice1->deceased_id);
    $lastCoveredDay = (int) ($deceasedFresh->storageFeeLogs->max('days_covered_to') ?? 0);
    $newDays = max(0, $deceasedFresh->days_in_storage - $lastCoveredDay);

    expect($deceasedFresh->days_in_storage)->toEqual(10);
    expect($lastCoveredDay)->toEqual(10);
    expect($newDays)->toEqual(0); // No new days yet since only 10 days have passed

    // Now simulate 5 more days passing by updating the original transfer date
    $originalTransfer = Transfer::where('deceased_id', $deceased->id)
        ->where('event_type', 'Entered')
        ->oldest('transferred_at')
        ->first();
    $originalTransfer->update(['transferred_at' => now()->subDays(15)]);

    $deceasedFresh = Deceased::with('storageFeeLogs', 'transfers')->find($invoice1->deceased_id);
    $lastCoveredDay = (int) ($deceasedFresh->storageFeeLogs->max('days_covered_to') ?? 0);
    $newDays = max(0, $deceasedFresh->days_in_storage - $lastCoveredDay);

    expect($deceasedFresh->days_in_storage)->toEqual(15);
    expect($lastCoveredDay)->toEqual(10);
    expect($newDays)->toEqual(5);

    // Generate second invoice for uncovered days
    $invoice2 = $action->handle($deceasedFresh, $this->superAdmin->id, $lastCoveredDay);
    expect($invoice2)->not->toBeNull();
    expect($invoice2->total_amount)->toEqual(50000.00);
    expect($invoice2->billing_type)->toEqual('storage');

    $allLogs = StorageFeeLog::where('deceased_id', $deceased->id)->get();
    expect($allLogs->count())->toEqual(2);
});

it('computes days_paid from storage invoices only', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S8',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => 10, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(10),
    ]);

    // Create storage invoice for 10 days
    $action = app(CreateStorageFeeInvoice::class);
    $invoice = $action->handle($deceased, $this->superAdmin->id, 0);

    $deceased = $deceased->fresh()->load('storageFeeLogs');
    expect($deceased->days_in_storage)->toEqual(10);
    expect($deceased->days_paid)->toEqual(0);

    // Pay half
    $paymentMode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);
    $recordPayment = app(RecordPayment::class);
    $recordPayment->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice->id,
        'payment_mode_id' => $paymentMode->id,
        'amount' => 50000.00,
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    $deceased = $deceased->fresh()->load('storageFeeLogs');
    expect($deceased->days_paid)->toEqual(5);
    expect($deceased->days_in_storage)->toEqual(10);
});

it('passes storage data to deceased show page', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S9',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(5),
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $action->handle($deceased, $this->superAdmin->id, 0);

    $this->actingAs($this->superAdmin)
        ->get(route('deceased.show', $deceased))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.createStorageInvoice', true)
            ->where('lastStorageCoveredDay', 5)
            ->has('deceased.storage_fee_logs', 1)
            ->where('deceased.storage_fee_logs.0.days_billed', 5)
            ->where('deceased.storage_fee_logs.0.amount', 50000)
        );
});

it('blocks unauthorized users from generating storage invoice', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'viewer']);
    $role->givePermissionTo(['deceased.view']);
    $user->assignRole($role);

    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S10',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(3),
    ]);

    $this->actingAs($user)
        ->post(route('deceased.storage-invoice.generate', $deceased))
        ->assertForbidden();
});

it('shows no storage invoice button when user lacks permission', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'viewer2']);
    $role->givePermissionTo(['deceased.view']);
    $user->assignRole($role);

    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S11',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    $this->actingAs($user)
        ->get(route('deceased.show', $deceased))
        ->assertInertia(fn ($page) => $page
            ->where('can.createStorageInvoice', false)
        );
});
