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
use App\Models\Transfer;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'deceased.view']);
    Permission::firstOrCreate(['name' => 'deceased.edit']);
    $role->givePermissionTo(['deceased.view', 'deceased.edit']);
    $this->superAdmin->assignRole($role);

    $this->user = User::factory()->create();
});

it('automatically generates a release code when a deceased record is created', function () {
    $deceased = Deceased::factory()->pending()->create([
        'release_code' => null,
    ]);

    expect($deceased->release_code)->not->toBeNull();
    expect($deceased->release_code)->toStartWith('DEC-');
    expect(strlen($deceased->release_code))->toBe(12); // 'DEC-' (4 chars) + 8 random chars
});

it('requires authentication to view release form', function () {
    $deceased = Deceased::factory()->pending()->create();

    $this->get(route('deceased.show-release', $deceased))
        ->assertRedirect(route('login'));
});

it('allows authorized users to view release form', function () {
    $deceased = Deceased::factory()->pending()->create();

    $this->actingAs($this->superAdmin)
        ->get(route('deceased.show-release', $deceased))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('deceased/release'));
});

it('fails release validation if release code is incorrect', function () {
    $deceased = Deceased::factory()->pending()->create();

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.release', $deceased), [
            'release_code' => 'INCORRECT_CODE',
            'released_to_name' => 'John Doe',
            'released_to_phone' => '123456789',
            'released_to_relationship' => 'Son',
            'released_to_id_type' => 'National ID',
            'released_to_id_number' => 'N12345',
            'confirm_physical_verification' => true,
        ])
        ->assertSessionHasErrors(['release_code']);
});

it('successfully releases deceased when correct code is provided', function () {
    $chamber = Chamber::factory()->create(['capacity' => 1]);
    $deceased = Deceased::factory()->create([
        'status' => 'InChamber',
        'chamber_id' => $chamber->id,
    ]);

    $releaseCode = $deceased->release_code;

    $this->actingAs($this->superAdmin)
        ->post(route('deceased.release', $deceased), [
            'release_code' => $releaseCode,
            'released_to_name' => 'John Doe',
            'released_to_phone' => '123-456-7890',
            'released_to_relationship' => 'Son',
            'released_to_id_type' => 'Passport',
            'released_to_id_number' => 'P987654',
            'confirm_physical_verification' => true,
            'release_notes' => 'Handed over personal belongings.',
        ])
        ->assertRedirect(route('deceased.show', $deceased))
        ->assertSessionHas('flash.message', 'Deceased has been released successfully and chamber capacity updated.');

    // Refresh model and verify fields
    $deceased->refresh();
    expect($deceased->status)->toBe('Released');
    expect($deceased->chamber_id)->toBeNull();
    expect($deceased->released_to_name)->toBe('John Doe');
    expect($deceased->released_to_phone)->toBe('123-456-7890');
    expect($deceased->released_to_relationship)->toBe('Son');
    expect($deceased->released_to_id_type)->toBe('Passport');
    expect($deceased->released_to_id_number)->toBe('P987654');
    expect($deceased->released_at)->not->toBeNull();
    expect($deceased->released_by)->toBe($this->superAdmin->id);

    // Verify transfer history was logged
    $this->assertDatabaseHas('transfers', [
        'deceased_id' => $deceased->id,
        'from_chamber_id' => $chamber->id,
        'to_chamber_id' => null,
        'event_type' => 'Released',
        'notes' => 'Handed over personal belongings.',
    ]);
});

it('issues a refund invoice for a storage surplus on release', function () {
    $service = Service::create(['name' => 'Chamber Storage']);
    $chamber = Chamber::factory()->create(['capacity' => 2, 'service_id' => $service->id]);
    $category = ServiceCategory::factory()->create();

    $price = ServicePrice::create([
        'service_id' => $service->id,
        'service_category_id' => $category->id,
        'price' => 10000.00,
    ]);
    ServicePriceTier::create(['service_price_id' => $price->id, 'start_day' => 1, 'end_day' => null, 'price' => 10000.00]);

    $deceased = Deceased::factory()->create([
        'status' => 'InChamber',
        'chamber_id' => $chamber->id,
        'service_category_id' => $category->id,
    ]);

    Transfer::create([
        'deceased_id' => $deceased->id,
        'to_chamber_id' => $chamber->id,
        'transferred_by' => $this->superAdmin->id,
        'event_type' => 'Entered',
        'transferred_at' => now()->subDays(5),
    ]);

    // Bill 5 days (50,000), pay it in full, then take a general wallet
    // deposit of 20,000 that exceeds the storage total -> 20,000 surplus owed.
    $action = app(CreateStorageFeeInvoice::class);
    $invoice = $action->handle($deceased->fresh(), $this->superAdmin->id, 0);
    expect((float) $invoice->total_amount)->toEqual(50000.00);

    $mode = PaymentMode::firstOrCreate(['name' => 'Cash', 'is_active' => true]);
    app(RecordPayment::class)->handle([
        'deceased_id' => $deceased->id,
        'invoice_id' => $invoice->id,
        'payment_mode_id' => $mode->id,
        'amount' => 50000.00, // storage settled in full
        'payment_date' => now()->toDateString(),
        'notes' => null,
    ], (string) $this->superAdmin->id);

    // Overpay via a general (unattached) wallet deposit: 70,000 in, 50,000
    // consumed by storage -> 20,000 surplus refunded on release.
    Payment::create([
        'deceased_id' => $deceased->id,
        'invoice_id' => null,
        'payment_mode_id' => $mode->id,
        'receipt_number' => 'REC-DEPOSIT-1',
        'amount' => 20000.00,
        'payment_method' => 'Cash',
        'payment_date' => now(),
        'received_by' => $this->superAdmin->id,
    ]);

    expect($deceased->fresh()->lifetimeStorageSurplus())->toEqual(20000.00);

    // Release: a refund of the 20,000 surplus must be booked.
    $this->actingAs($this->superAdmin)
        ->post(route('deceased.release', $deceased), [
            'release_code' => $deceased->release_code,
            'released_to_name' => 'Jane',
            'released_to_phone' => '111',
            'released_to_relationship' => 'Daughter',
            'released_to_id_type' => 'Passport',
            'released_to_id_number' => 'X1',
            'confirm_physical_verification' => true,
        ])
        ->assertRedirect(route('deceased.show', $deceased));

    $refund = Invoice::where('deceased_id', $deceased->id)
        ->where('billing_type', 'refund')
        ->first();
    expect($refund)->not->toBeNull();
    expect((float) $refund->total_amount)->toEqual(-20000.00);
    expect($refund->status)->toBe('Refunded');

    // And a negative general receipt records the money leaving the account.
    $this->assertDatabaseHas('payments', [
        'deceased_id' => $deceased->id,
        'invoice_id' => null,
        'amount' => -20000.00,
    ]);

    // The ledger now nets out: the refund cancels the surplus.
    expect($deceased->fresh()->lifetimeStorageOutstanding())->toEqual(0.00);
});
