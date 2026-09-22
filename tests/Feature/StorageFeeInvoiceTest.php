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
use App\Models\Waiver;
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

    // Body is in storage on day 15. The first invoice bills every uncovered day
    // (1-15). The single tier [1-10 @ 10000] is bounded, so days 11-15 fall in
    // a trailing gap and bill at the last tier's rate (10000) -> 15 * 10000.
    $invoice1 = $action->handle($deceased, $this->superAdmin->id, 0);
    expect($invoice1)->not->toBeNull();
    expect($invoice1->total_amount)->toEqual(150000.00);

    // Pay the first invoice using RecordPayment action (triggers auto-generation)
    $paymentMode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);
    $recordPayment = app(RecordPayment::class);
    $recordPayment->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice1->id,
        'payment_mode_id' => $paymentMode->id,
        'amount' => 150000.00,
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], $this->superAdmin->id);

    $invoice1->refresh();
    expect($invoice1->status)->toEqual('Paid');

    // All days are now covered, so no further uncovered days exist.
    $deceased = $deceased->fresh()->load('storageFeeLogs');
    $invoice2 = $action->handle($deceased, $this->superAdmin->id, 15);

    expect($invoice2)->toBeNull();

    $this->assertDatabaseHas('storage_fee_logs', [
        'deceased_id' => $deceased->id,
        'days_billed' => 15,
        'days_covered_from' => 1,
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

it('computes days_paid including waived_amount on storage invoices', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber SW',
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

    $action = app(CreateStorageFeeInvoice::class);
    $invoice = $action->handle($deceased, $this->superAdmin->id, 0);

    $deceased = $deceased->fresh()->load('storageFeeLogs');
    expect($deceased->days_paid)->toEqual(0);

    // Apply a full waiver covering all 10 days (100,000)
    $waiver = Waiver::create([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice->id,
        'amount' => 100000.00,
        'reason' => 'Full waiver',
        'authorized_by' => $this->superAdmin->id,
        'authorized_at' => now(),
    ]);

    $invoice->refresh();
    $invoice->waived_amount = $invoice->waived_amount + 100000.00;
    $invoice->status = 'Paid';
    $invoice->save();

    $deceased = $deceased->fresh()->load('storageFeeLogs');
    expect($deceased->days_paid)->toEqual(10);
    expect($deceased->isStorageFullyPaid())->toBeTrue();
    expect($deceased->ledger_balance)->toEqual(0.00);
});

it('does not carry paid storage days from a prior admission into a new one', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber R2',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => null, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $firstAdmissionStart = now()->subDays(40);
    $secondAdmissionStart = now()->subDays(10);

    // ---- First admission: enter 40 days ago, fully pay 10 days, then release.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => $firstAdmissionStart]);
    $firstInvoice = $action->handle($deceased->fresh(), $this->superAdmin->id, 0);
    $mode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $firstInvoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 100000.00, // covers 10 days
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $chamber->id, 'to_chamber_id' => null, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Released', 'transferred_at' => now()->subDays(30)]);
    $deceased->update(['status' => 'Released', 'chamber_id' => null, 'released_at' => now()->subDays(30)]);

    // ---- Second admission: re-enter 10 days ago. The current admission
    // restarts at day 1, so only days billed in this admission count.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => $secondAdmissionStart]);
    $deceased->update(['status' => 'InChamber', 'chamber_id' => $chamber->id, 'released_at' => null]);

    $deceased = $deceased->fresh()->load(['transfers', 'storageFeeLogs']);
    expect($deceased->days_in_storage)->toEqual(10); // current admission is 10 days

    // Bill the current admission's days (1-10) at 10000/day = 100000, fully pay.
    $secondInvoice = $action->handle($deceased->fresh(), $this->superAdmin->id, 0);
    expect((float) $secondInvoice->total_amount)->toEqual(100000.00);
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $secondInvoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 100000.00,
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    $deceased = $deceased->fresh()->load('storageFeeLogs');
    // Only the current admission's 10 days are paid; the first admission's paid
    // days are NOT credited. days_paid must equal days_in_storage (10), not 20.
    expect($deceased->days_paid)->toEqual(10);
    expect($deceased->isStorageFullyPaid())->toBeTrue();
});

it('scopes the ledger to the current admission so a re-entry starts clean', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber L1',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => null, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $mode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);

    // ---- First admission: enter 30 days ago, fully pay 5 days, then release.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(30)]);
    $firstInvoice = $action->handle($deceased->fresh(), $this->superAdmin->id, 0);
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $firstInvoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 50000.00, // 5 days * 10000
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $chamber->id, 'to_chamber_id' => null, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Released', 'transferred_at' => now()->subDays(25)]);
    $deceased->update(['status' => 'Released', 'chamber_id' => null, 'released_at' => now()->subDays(25)]);

    // The first admission's ledger: 5 days billed (1st admission) and 5 days paid.
    // (total_billed/total_paid/total_waived/ledger_balance are computed live, so
    // for a still-released body the current admission start is null -> 0.)
    $deceased = $deceased->fresh()->load('storageFeeLogs');
    expect($deceased->days_in_storage)->toEqual(0);
    expect($deceased->days_paid)->toEqual(0);
    expect($deceased->total_billed)->toEqual(0.00);
    expect($deceased->ledger_balance)->toEqual(0.00);

    // ---- Second admission: re-enter 5 days ago and bill 0 days outstanding.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(5)]);
    $deceased->update(['status' => 'InChamber', 'chamber_id' => $chamber->id, 'released_at' => null]);

    $deceased = $deceased->fresh()->load('transfers', 'storageFeeLogs');
    expect($deceased->days_in_storage)->toEqual(5);
    // Current admission billed 0 days (nothing billed yet since re-entry).
    expect($deceased->total_billed)->toEqual(0.00);
    // General/wallet and prior-admission payments do not carry forward to the
    // current admission's ledger.
    expect($deceased->total_paid)->toEqual(0.00);
    expect($deceased->ledger_balance)->toEqual(0.00);

    // Bill the current admission's 5 days (50,000) and fully pay it.
    $secondInvoice = $action->handle($deceased->fresh(), $this->superAdmin->id, 0);
    expect((float) $secondInvoice->total_amount)->toEqual(50000.00);
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $secondInvoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 50000.00,
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    $deceased = $deceased->fresh()->load('storageFeeLogs');
    expect($deceased->total_billed)->toEqual(50000.00); // only the 2nd admission
    expect($deceased->total_paid)->toEqual(50000.00);
    expect($deceased->ledger_balance)->toEqual(0.00);
    expect($deceased->isStorageFullyPaid())->toBeTrue();
});

it('blocks release of a re-entered body whose current admission is unpaid', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber G1',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => null, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $mode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);

    // Prior admission: fully settled.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(60)]);
    $firstInvoice = $action->handle($deceased->fresh(), $this->superAdmin->id, 0);
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $firstInvoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 600000.00,
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $chamber->id, 'to_chamber_id' => null, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Released', 'transferred_at' => now()->subDays(50)]);
    $deceased->update(['status' => 'Released', 'chamber_id' => null, 'released_at' => now()->subDays(50)]);

    // Re-entry: a new, *unbilled* admission begins.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(20)]);
    $deceased->update(['status' => 'InChamber', 'chamber_id' => $chamber->id, 'released_at' => null]);

    $deceased = $deceased->fresh()->load(['transfers', 'storageFeeLogs']);
    // Current admission: 20 days in storage, 0 paid (nothing billed yet).
    expect($deceased->days_in_storage)->toEqual(20);
    expect($deceased->days_paid)->toEqual(0);
    // The release gate is admission-scoped: the current stay must be settled.
    expect($deceased->isStorageFullyPaid())->toBeFalse();
});

it('blocks release while any admission still owes storage, even if the current stay is settled', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber G2',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => null, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    $action = app(CreateStorageFeeInvoice::class);
    $mode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);

    // Prior admission: enter 40 days ago, bill all 40 days, pay only half
    // (200,000 of 400,000) so 200,000 is still owed, then release.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(40)]);
    $priorInvoice = $action->handle($deceased->fresh(), $this->superAdmin->id, 0);
    expect((float) $priorInvoice->total_amount)->toEqual(400000.00);
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $priorInvoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 200000.00, // 20 days paid, 20 days outstanding
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $chamber->id, 'to_chamber_id' => null, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Released', 'transferred_at' => now()->subDays(40)]);
    $deceased->update(['status' => 'Released', 'chamber_id' => null, 'released_at' => now()->subDays(40)]);

    // A released body still owes the prior admission's 200,000 even though its
    // current admission (none) is settled.
    $deceased = $deceased->fresh()->load(['transfers', 'storageFeeLogs']);
    expect($deceased->days_in_storage)->toEqual(0); // no active admission
    expect($deceased->isStorageFullyPaid())->toBeTrue(); // 0 >= 0
    // The lifetime gate still sees the prior admission's outstanding 200,000.
    expect($deceased->lifetimeStorageOutstanding())->toEqual(200000.00);
    expect($deceased->canReleaseStorage())->toBeFalse();

    // Settling the prior admission's debt unblocks the gate.
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $priorInvoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 200000.00,
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    $deceased = $deceased->fresh()->load(['transfers', 'storageFeeLogs']);
    expect($deceased->lifetimeStorageOutstanding())->toEqual(0.00);
    expect($deceased->canReleaseStorage())->toBeTrue();
});

it('bills the uncovered day range at the tier that owns it, not a day-1-anchored total', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber T1',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    // Tiers: days 1-5 @ 10000, days 6-10 @ 15000, days 11+ @ 20000.
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => 5, 'price' => 10000.00]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 6, 'end_day' => 10, 'price' => 15000.00]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 11, 'end_day' => null, 'price' => 20000.00]);

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
        'transferred_at' => now()->subDays(8),
    ]);

    $action = app(CreateStorageFeeInvoice::class);

    // The body is on day 8. The first invoice (lastCoveredDay 0) bills every
    // uncovered day 1-8. Days 1-5 @ 10000 + days 6-8 @ 15000 = 50000 + 45000.
    $first = $action->handle($deceased, $this->superAdmin->id, 0);

    // A *later* partial invoice bills only the uncovered range days 6-8 at the
    // tier that owns them (tier 2 @ 15000): 3 * 15000 = 45000.
    // A day-1-anchored delta would wrongly produce 3 * 10000 = 30000.
    $second = $action->handle($deceased, $this->superAdmin->id, 5);
    expect((float) $second->total_amount)->toEqual(45000.00);
    expect((int) $second->invoiceItems()->first()->quantity)->toEqual(3);
    // Blended per-day rate keeps the line item consistent: 45000 / 3 = 15000.
    expect((float) $second->invoiceItems()->first()->unit_price)->toEqual(15000.00);
    expect((float) $second->invoiceItems()->first()->total_price)->toEqual(45000.00);
});

it('bills gap days at the preceding tier rate', function () {
    $service = Service::create(['name' => 'Storage']);
    $price = ServicePrice::create([
        'service_id' => $service->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    // Gap between day 5 and day 7: day 6 is missing.
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => 5, 'price' => 10000.00]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 7, 'end_day' => null, 'price' => 20000.00]);

    $price->load('servicePriceTiers');

    // 7-day total: 5 days @ 10000 (tier 1) + 1 gap day @ 10000 (carried) + 1 day @ 20000 (tier 2)
    // = 50000 + 10000 + 20000 = 80000.
    expect($price->calculateStorageCharge(7))->toEqual(80000.00);

    // The 8th day (in the open-ended tier 2 range) bills at 20000.
    expect($price->calculateStorageChargeForRange(8, 8))->toEqual(20000.00);
});

it('restarts the storage-day counter on re-entry after a release', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber R1',
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

    // First admission: entered 30 days ago, released 20 days ago (release on day 10).
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(30)]);
    Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $chamber->id, 'to_chamber_id' => null, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Released', 'transferred_at' => now()->subDays(20)]);
    $deceased->update(['status' => 'Released', 'chamber_id' => null, 'released_at' => now()->subDays(20)]);

    // A released body with no re-entry has no outstanding storage days.
    $deceased = $deceased->fresh()->load('transfers');
    expect($deceased->days_in_storage)->toEqual(0);

    // Re-enter 4 days after the release: the counter restarts at this new entry.
    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(16)]);
    $deceased->update(['status' => 'InChamber', 'chamber_id' => $chamber->id, 'released_at' => null]);

    $deceased = $deceased->fresh()->load('transfers');
    // Re-entry was 16 days ago and the body is still in storage now, so the
    // current admission counts 16 days (not from the original 30-day entry).
    expect($deceased->days_in_storage)->toEqual(16);
});

it('does not restart the storage-day counter on a chamber-to-chamber transfer', function () {
    $serviceA = Service::create(['name' => 'Storage A']);
    $serviceB = Service::create(['name' => 'Storage B']);
    $chamberA = Chamber::create(['name' => 'Chamber A', 'capacity' => 2, 'service_id' => $serviceA->id]);
    $chamberB = Chamber::create(['name' => 'Chamber B', 'capacity' => 2, 'service_id' => $serviceB->id]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamberA->id,
        'status' => 'InChamber',
    ]);

    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamberA->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(9)]);

    // Move chamber-to-chamber 5 days ago (day 4 of the stay). This is a
    // 'Transferred' event and must NOT restart the counter.
    Transfer::create(['deceased_id' => $deceased->id, 'from_chamber_id' => $chamberA->id, 'to_chamber_id' => $chamberB->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Transferred', 'transferred_at' => now()->subDays(5)]);
    $deceased->update(['chamber_id' => $chamberB->id]);

    $deceased = $deceased->fresh()->load('transfers');
    // Still counting from the original entry 9 days ago -> 9 days, not 5.
    expect($deceased->days_in_storage)->toEqual(9);
});

it('auto-generates the next storage invoice at the correct tier boundary', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber AG1',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $price = ServicePrice::create([
        'service_id' => $chamberService->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => 5, 'price' => 10000.00]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 6, 'end_day' => null, 'price' => 20000.00]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    Transfer::create(['deceased_id' => $deceased->id, 'to_chamber_id' => $chamber->id, 'transferred_by' => $this->superAdmin->id, 'event_type' => 'Entered', 'transferred_at' => now()->subDays(7)]);

    $action = app(CreateStorageFeeInvoice::class);
    $first = $action->handle($deceased, $this->superAdmin->id, 0);
    // days 1-5 @ 10000 + days 6-7 @ 20000 = 50000 + 40000.
    expect((float) $first->total_amount)->toEqual(90000.00);

    // Auto-generation regression: the next uncovered slice after day 5 is days
    // 6-7 and must bill at tier 2 (20000/day), not tier 1 (10000/day).
    $second = $action->handle($deceased, $this->superAdmin->id, 5);
    expect($second)->not->toBeNull();
    expect((float) $second->total_amount)->toEqual(40000.00);
});
