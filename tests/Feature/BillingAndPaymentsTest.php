<?php

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\ServicePriceTier;
use App\Models\Transfer;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'deceased.view']);
    Permission::firstOrCreate(['name' => 'deceased.edit']);
    Permission::firstOrCreate(['name' => 'deceased.create']);
    Permission::firstOrCreate(['name' => 'deceased.bypass-billing']);
    Permission::firstOrCreate(['name' => 'payments.view']);
    Permission::firstOrCreate(['name' => 'payments.manage']);
    Permission::firstOrCreate(['name' => 'payment-modes.view']);
    Permission::firstOrCreate(['name' => 'payment-modes.manage']);
    $role->givePermissionTo([
        'deceased.view',
        'deceased.edit',
        'deceased.create',
        'deceased.bypass-billing',
        'payments.view',
        'payments.manage',
        'payment-modes.view',
        'payment-modes.manage',
    ]);
    $this->superAdmin->assignRole($role);

    $this->staffUser = User::factory()->create();
    $staffRole = Role::firstOrCreate(['name' => 'staff']);
    $staffRole->givePermissionTo(['deceased.view', 'deceased.edit', 'deceased.create']);
    $this->staffUser->assignRole($staffRole);

    $this->category = ServiceCategory::factory()->create(['name' => 'VIP']);
});

it('requires service_category_id and source on registration', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'gender' => 'Female',
            'date_of_death' => now()->format('Y-m-d'),
            'relative_name' => 'John Doe',
            'relative_phone' => '1234567890',
            'relative_relationship' => 'Spouse',
        ])
        ->assertSessionHasErrors(['service_category_id', 'source']);
});

it('successfully registers deceased with service_category_id and source', function () {
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'gender' => 'Female',
            'date_of_death' => now()->format('Y-m-d'),
            'relative_name' => 'John Doe',
            'relative_phone' => '1234567890',
            'relative_relationship' => 'Spouse',
            'service_category_id' => $this->category->id,
            'source' => 'In Hospital',
        ])
        ->assertRedirect(route('deceased.index'));

    $this->assertDatabaseHas('deceased', [
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'service_category_id' => $this->category->id,
        'source' => 'In Hospital',
    ]);
});

it('calculates tiered storage fees correctly', function () {
    $service = Service::create(['name' => 'Chamber Storage']);
    $price = ServicePrice::create([
        'service_id' => $service->id,
        'service_category_id' => $this->category->id,
        'price' => 10.00,
    ]);

    // Create tiers
    // Days 1-5: $10.00/day
    // Days 6-10: $15.00/day
    // Days 11+: $20.00/day
    ServicePriceTier::create([
        'service_price_id' => $price->id,
        'start_day' => 1,
        'end_day' => 5,
        'price' => 10.00,
    ]);
    ServicePriceTier::create([
        'service_price_id' => $price->id,
        'start_day' => 6,
        'end_day' => 10,
        'price' => 15.00,
    ]);
    ServicePriceTier::create([
        'service_price_id' => $price->id,
        'start_day' => 11,
        'end_day' => null,
        'price' => 20.00,
    ]);

    // Refresh relationships
    $price->load('servicePriceTiers');

    // Scenario 1: 3 days spent (3 * 10 = $30)
    expect($price->calculateStorageCharge(3))->toEqual(30.00);

    // Scenario 2: 7 days spent (5 * 10 + 2 * 15 = $80)
    expect($price->calculateStorageCharge(7))->toEqual(80.00);

    // Scenario 3: 12 days spent (5 * 10 + 5 * 15 + 2 * 20 = $165)
    expect($price->calculateStorageCharge(12))->toEqual(165.00);
});

it('computes ledger balance from deposits and invoices correctly', function () {
    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'source' => 'Outside Hospital',
    ]);

    // Invoice setup
    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-TEST-01',
        'subtotal' => 150.00,
        'discount' => 10.00,
        'total_amount' => 140.00,
        'created_by' => $this->superAdmin->id,
    ]);

    // Check balance with no payments
    $deceased->load('invoice');
    expect($deceased->total_billed)->toEqual(140.00);
    expect($deceased->total_paid)->toEqual(0.00);
    expect($deceased->ledger_balance)->toEqual(140.00);
    expect($deceased->isBillSettled())->toBeFalse();

    // Add a deposit (payment with null invoice_id)
    Payment::create([
        'deceased_id' => $deceased->id,
        'invoice_id' => null,
        'receipt_number' => 'REC-TEST-01',
        'amount' => 50.00,
        'payment_method' => 'Cash',
        'payment_date' => now(),
        'received_by' => $this->superAdmin->id,
    ]);

    // Check balance again
    expect($deceased->fresh()->total_paid)->toEqual(50.00);
    expect($deceased->fresh()->ledger_balance)->toEqual(90.00);
    expect($deceased->fresh()->isBillSettled())->toBeFalse();

    // Add remaining payment
    Payment::create([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice->id,
        'receipt_number' => 'REC-TEST-02',
        'amount' => 90.00,
        'payment_method' => 'BankTransfer',
        'payment_date' => now(),
        'received_by' => $this->superAdmin->id,
    ]);

    expect($deceased->fresh()->total_paid)->toEqual(140.00);
    expect($deceased->fresh()->ledger_balance)->toEqual(0.00);
    expect($deceased->fresh()->isBillSettled())->toBeTrue();
});

it('blocks release if outstanding balance exists and no bypass is checked', function () {
    $chamber = Chamber::factory()->create();
    $deceased = Deceased::factory()->create([
        'status' => 'InChamber',
        'chamber_id' => $chamber->id,
        'service_category_id' => $this->category->id,
    ]);

    // Outstanding balance setup
    Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-TEST-02',
        'total_amount' => 100.00,
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.release', $deceased), [
            'release_code' => $deceased->release_code,
            'released_to_name' => 'Jane Doe',
            'released_to_phone' => '1234567890',
            'released_to_relationship' => 'Daughter',
            'released_to_id_type' => 'National ID',
            'released_to_id_number' => 'N9999',
            'confirm_physical_verification' => true,
        ])
        ->assertSessionHasErrors(['billing'])
        ->assertSessionHas('flash.message', 'Cannot release deceased with outstanding balance of 100.00 without manager override.');

    expect($deceased->fresh()->status)->toBe('InChamber');
});

it('allows release if bypass_billing_restriction is checked and user is authorized', function () {
    $chamber = Chamber::factory()->create();
    $deceased = Deceased::factory()->create([
        'status' => 'InChamber',
        'chamber_id' => $chamber->id,
        'service_category_id' => $this->category->id,
    ]);

    Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-TEST-03',
        'total_amount' => 100.00,
        'created_by' => $this->superAdmin->id,
    ]);

    // acting as super admin (has bypass-billing permission)
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.release', $deceased), [
            'release_code' => $deceased->release_code,
            'released_to_name' => 'Jane Doe',
            'released_to_phone' => '1234567890',
            'released_to_relationship' => 'Daughter',
            'released_to_id_type' => 'National ID',
            'released_to_id_number' => 'N9999',
            'confirm_physical_verification' => true,
            'bypass_billing_restriction' => true,
        ])
        ->assertRedirect(route('deceased.show', $deceased))
        ->assertSessionHas('flash.message', 'Deceased has been released successfully and chamber capacity updated.');

    expect($deceased->fresh()->status)->toBe('Released');
});

it('blocks release bypass if user lacks deceased.bypass-billing permission', function () {
    $chamber = Chamber::factory()->create();
    $deceased = Deceased::factory()->create([
        'status' => 'InChamber',
        'chamber_id' => $chamber->id,
        'service_category_id' => $this->category->id,
    ]);

    Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-TEST-04',
        'total_amount' => 100.00,
        'created_by' => $this->superAdmin->id,
    ]);

    // staff user lacks deceased.bypass-billing permission
    $this->actingAs($this->staffUser)
        ->post(route('deceased.release', $deceased), [
            'release_code' => $deceased->release_code,
            'released_to_name' => 'Jane Doe',
            'released_to_phone' => '1234567890',
            'released_to_relationship' => 'Daughter',
            'released_to_id_type' => 'National ID',
            'released_to_id_number' => 'N9999',
            'confirm_physical_verification' => true,
            'bypass_billing_restriction' => true,
        ])
        ->assertForbidden();
});

it('allows super admin to list and view invoices', function () {
    $deceased = Deceased::factory()->create(['service_category_id' => $this->category->id]);
    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-LIST-TEST',
        'total_amount' => 100.00,
        'created_by' => $this->superAdmin->id,
    ]);

    Permission::firstOrCreate(['name' => 'invoices.view']);
    $this->superAdmin->givePermissionTo('invoices.view');

    $this->actingAs($this->superAdmin)
        ->get(route('invoices.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('invoices/index'));

    $this->actingAs($this->superAdmin)
        ->get(route('invoices.show', $invoice))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('invoices/show'));
});

it('allows super admin to list and view payments', function () {
    $deceased = Deceased::factory()->create(['service_category_id' => $this->category->id]);
    $payment = Payment::create([
        'deceased_id' => $deceased->id,
        'receipt_number' => 'REC-LIST-TEST',
        'amount' => 100.00,
        'payment_method' => 'Cash',
        'payment_date' => now(),
        'received_by' => $this->superAdmin->id,
    ]);

    Permission::firstOrCreate(['name' => 'payments.view']);
    $this->superAdmin->givePermissionTo('payments.view');

    $this->actingAs($this->superAdmin)
        ->get(route('payments.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('payments/index'));

    $this->actingAs($this->superAdmin)
        ->get(route('payments.show', $payment))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('payments/show'));
});

it('can create and update deceased invoices with correct category pricing', function () {
    $service1 = Service::create(['name' => 'Embalming']);
    $service2 = Service::create(['name' => 'Storage Fee']);

    ServicePrice::create([
        'service_id' => $service1->id,
        'service_category_id' => $this->category->id,
        'price' => 50000.00,
    ]);

    ServicePrice::create([
        'service_id' => $service2->id,
        'service_category_id' => $this->category->id,
        'price' => 10000.00,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
    ]);

    // Create Invoice via POST
    $response = $this->actingAs($this->superAdmin)
        ->post(route('deceased.invoice.save', $deceased), [
            'items' => [
                ['service_id' => $service1->id, 'quantity' => 1],
                ['service_id' => $service2->id, 'quantity' => 3],
            ],
            'notes' => 'First service invoice note',
        ]);

    $response->assertRedirect(route('deceased.show', $deceased));

    $this->assertDatabaseHas('invoices', [
        'deceased_id' => $deceased->id,
        'subtotal' => 80000.00, // 50000*1 + 10000*3
        'total_amount' => 80000.00,
        'notes' => 'First service invoice note',
    ]);

    $invoice = Invoice::where('deceased_id', $deceased->id)->first();

    $this->assertDatabaseHas('invoice_items', [
        'invoice_id' => $invoice->id,
        'service_id' => $service1->id,
        'quantity' => 1,
        'unit_price' => 50000.00,
        'total_price' => 50000.00,
    ]);

    $this->assertDatabaseHas('invoice_items', [
        'invoice_id' => $invoice->id,
        'service_id' => $service2->id,
        'quantity' => 3,
        'unit_price' => 10000.00,
        'total_price' => 30000.00,
    ]);

    // Update the invoice
    $responseUpdate = $this->actingAs($this->superAdmin)
        ->post(route('deceased.invoice.save', $deceased), [
            'items' => [
                ['service_id' => $service1->id, 'quantity' => 2],
            ],
            'notes' => 'Updated invoice note',
        ]);

    $responseUpdate->assertRedirect(route('deceased.show', $deceased));

    $this->assertDatabaseHas('invoices', [
        'id' => $invoice->id,
        'subtotal' => 100000.00, // 50000*2
        'total_amount' => 100000.00,
        'notes' => 'Updated invoice note',
    ]);

    // Check old items are deleted and replaced
    $this->assertDatabaseMissing('invoice_items', [
        'invoice_id' => $invoice->id,
        'service_id' => $service2->id,
    ]);
});

it('calculates days spent in storage and days paid accurately', function () {
    $chamberService = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::create([
        'name' => 'Chamber S1',
        'capacity' => 2,
        'service_id' => $chamberService->id,
    ]);

    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'source' => 'In Hospital',
        'chamber_id' => $chamber->id,
        'status' => 'InChamber',
    ]);

    // Create admission/transfer event 5 days ago
    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(5),
    ]);

    // Check days spent is 5
    expect($deceased->fresh()->days_in_storage)->toEqual(5);

    // Create Invoice with 10 days of Chamber Storage
    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-DAYS-01',
        'subtotal' => 1000.00,
        'total_amount' => 1000.00,
        'created_by' => $this->superAdmin->id,
    ]);

    $invoice->invoiceItems()->create([
        'service_id' => $chamberService->id,
        'name' => 'Chamber Storage',
        'unit_price' => 100.00,
        'quantity' => 10,
        'total_price' => 1000.00,
    ]);

    // 0 paid initially
    expect($deceased->fresh()->days_paid)->toEqual(0);

    // Make 50% payment (500)
    Payment::create([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice->id,
        'receipt_number' => 'REC-DAYS-01',
        'amount' => 500.00,
        'payment_method' => 'Cash',
        'payment_date' => now(),
        'received_by' => $this->superAdmin->id,
    ]);

    // Days paid should be 5
    expect($deceased->fresh()->days_paid)->toEqual(5);
});

it('applies source-specific service pricing accurately', function () {
    $service = Service::create(['name' => 'Admission Fee']);

    // Create pricing for VIP in-hospital vs outside-hospital
    $priceInHospital = ServicePrice::create([
        'service_id' => $service->id,
        'service_category_id' => $this->category->id,
        'source' => 'In Hospital',
        'price' => 10000.00,
    ]);

    $priceOutsideHospital = ServicePrice::create([
        'service_id' => $service->id,
        'service_category_id' => $this->category->id,
        'source' => 'Outside Hospital',
        'price' => 25000.00,
    ]);

    // Deceased originating from In Hospital
    $deceasedIn = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'source' => 'In Hospital',
    ]);

    // Deceased originating from Outside Hospital
    $deceasedOut = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'source' => 'Outside Hospital',
    ]);

    // Test Show route availableServices response data structure
    $this->actingAs($this->superAdmin)
        ->get(route('deceased.show', $deceasedIn))
        ->assertInertia(fn ($page) => $page
            ->has('availableServices', 1)
            ->where('availableServices.0.price', 10000)
        );

    $this->actingAs($this->superAdmin)
        ->get(route('deceased.show', $deceasedOut))
        ->assertInertia(fn ($page) => $page
            ->has('availableServices', 1)
            ->where('availableServices.0.price', 25000)
        );
});

it('can access payment modes index and manage them', function () {
    $mode = PaymentMode::first(); // Cash (seeded)

    // Index
    $this->actingAs($this->superAdmin)
        ->get(route('application-settings.payment-modes.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('paymentModes.data')
        );

    // Store new mode
    $this->actingAs($this->superAdmin)
        ->post(route('application-settings.payment-modes.store'), [
            'name' => 'Mobile Money Check',
            'is_active' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('payment_modes', ['name' => 'Mobile Money Check']);

    $newMode = PaymentMode::where('name', 'Mobile Money Check')->first();

    // Update mode
    $this->actingAs($this->superAdmin)
        ->put(route('application-settings.payment-modes.update', $newMode), [
            'name' => 'Mobile Money Updated',
            'is_active' => false,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('payment_modes', [
        'id' => $newMode->id,
        'name' => 'Mobile Money Updated',
        'is_active' => false,
    ]);

    // Delete mode
    $this->actingAs($this->superAdmin)
        ->delete(route('application-settings.payment-modes.destroy', $newMode))
        ->assertRedirect();

    $this->assertDatabaseMissing('payment_modes', ['id' => $newMode->id]);
});

it('can record a general account deposit and apply to ledger balance', function () {
    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'source' => 'Outside Hospital',
    ]);

    $mode = PaymentMode::first(); // Cash

    $this->actingAs($this->superAdmin)
        ->post(route('payments.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => null,
            'payment_mode_id' => $mode->id,
            'amount' => 5000.00,
            'payment_date' => now()->toDateString(),
            'notes' => 'Direct cash deposit',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('payments', [
        'deceased_id' => $deceased->id,
        'invoice_id' => null,
        'payment_mode_id' => $mode->id,
        'payment_method' => $mode->name,
        'amount' => 5000.00,
    ]);

    // Ledger balance should be -5000.00 since total billed is 0.00 and paid is 5000.00
    expect($deceased->fresh()->ledger_balance)->toEqual(-5000.00);
});

it('can record an invoice payment and update invoice status', function () {
    $deceased = Deceased::factory()->create([
        'service_category_id' => $this->category->id,
        'source' => 'Outside Hospital',
    ]);

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-TEST-99',
        'subtotal' => 10000.00,
        'discount' => 0.00,
        'total_amount' => 10000.00,
        'paid_amount' => 0.00,
        'status' => 'Unpaid',
        'created_by' => $this->superAdmin->id,
    ]);

    $mode = PaymentMode::first();

    // Partially pay the invoice
    $this->actingAs($this->superAdmin)
        ->post(route('payments.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'payment_mode_id' => $mode->id,
            'amount' => 4000.00,
            'payment_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    expect($invoice->fresh()->paid_amount)->toEqual(4000.00);
    expect($invoice->fresh()->status)->toEqual('Partially Paid');

    // Fully pay the invoice
    $this->actingAs($this->superAdmin)
        ->post(route('payments.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'payment_mode_id' => $mode->id,
            'amount' => 6000.00,
            'payment_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    expect($invoice->fresh()->paid_amount)->toEqual(10000.00);
    expect($invoice->fresh()->status)->toEqual('Paid');
});

it('applies tiered pricing correctly when saving a deceased invoice', function () {
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

    // Days 1-5: ₦10,000/day
    // Days 6-10: ₦15,000/day
    // Days 11+: ₦20,000/day
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
        'transferred_at' => now()->subDays(7),
    ]);

    expect($deceased->fresh()->days_in_storage)->toEqual(7);

    // Show route returns tiered price and has_tiers flag
    $this->actingAs($this->superAdmin)
        ->get(route('deceased.show', $deceased))
        ->assertInertia(fn ($page) => $page
            ->has('availableServices', 1)
            ->where('availableServices.0.service_id', (string) $chamberService->id)
            ->where('availableServices.0.has_tiers', true)
            ->where('availableServices.0.tiered_price', 80000)
            ->where('storageServiceId', (string) $chamberService->id)
        );

    // Save invoice with storage service — should use tiered total, not flat price × qty
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.invoice.save', $deceased), [
            'items' => [['service_id' => $chamberService->id, 'quantity' => 1]],
            'notes' => 'Tiered storage invoice',
        ]);

    $invoice = Invoice::where('deceased_id', $deceased->id)->first();

    // 5 days × 10,000 + 2 days × 15,000 = 80,000
    expect($invoice->total_amount)->toEqual(80000.00);
    expect($invoice->subtotal)->toEqual(80000.00);

    $this->assertDatabaseHas('invoice_items', [
        'invoice_id' => $invoice->id,
        'service_id' => $chamberService->id,
        'unit_price' => 80000.00,
        'quantity' => 7,
        'total_price' => 80000.00,
    ]);
});

it('uses flat price when service has no tiers', function () {
    $service = Service::create(['name' => 'Embalming']);
    $price = ServicePrice::create([
        'service_id' => $service->id,
        'service_category_id' => $this->category->id,
        'price' => 50000.00,
    ]);

    $deceased = Deceased::factory()->create(['service_category_id' => $this->category->id]);

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.invoice.save', $deceased), [
            'items' => [['service_id' => $service->id, 'quantity' => 2]],
            'notes' => 'Non-tiered service',
        ]);

    $invoice = Invoice::where('deceased_id', $deceased->id)->first();

    expect($invoice->total_amount)->toEqual(100000.00);

    $this->assertDatabaseHas('invoice_items', [
        'invoice_id' => $invoice->id,
        'service_id' => $service->id,
        'unit_price' => 50000.00,
        'quantity' => 2,
        'total_price' => 100000.00,
    ]);
});

it('rejects a payment linked to another deceased record invoice', function () {
    $deceased = Deceased::factory()->create(['service_category_id' => $this->category->id]);
    $otherDeceased = Deceased::factory()->create(['service_category_id' => $this->category->id]);
    $invoice = Invoice::create(['deceased_id' => $otherDeceased->id, 'invoice_number' => 'INV-OTHER-01', 'total_amount' => 100, 'created_by' => $this->superAdmin->id]);
    $mode = PaymentMode::first();

    $this->actingAs($this->superAdmin)
        ->post(route('payments.store'), ['deceased_id' => $deceased->id, 'invoice_id' => $invoice->id, 'payment_mode_id' => $mode->id, 'amount' => 10, 'payment_date' => now()->toDateString()])
        ->assertSessionHasErrors('invoice_id');

    expect(Payment::count())->toBe(0);
});
