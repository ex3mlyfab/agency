<?php

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Waiver;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->superAdmin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    Permission::firstOrCreate(['name' => 'deceased.view']);
    Permission::firstOrCreate(['name' => 'invoices.view']);
    Permission::firstOrCreate(['name' => 'waivers.view']);
    Permission::firstOrCreate(['name' => 'waivers.manage']);
    $role->givePermissionTo([
        'deceased.view',
        'invoices.view',
        'waivers.view',
        'waivers.manage',
    ]);
    $this->superAdmin->assignRole($role);

    $this->staffUser = User::factory()->create();
    $staffRole = Role::firstOrCreate(['name' => 'staff']);
    $staffRole->givePermissionTo(['deceased.view', 'invoices.view', 'waivers.view']);
    $this->staffUser->assignRole($staffRole);
});

it('allows super admin to view waivers index', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('waivers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('waivers/index'));
});

it('allows super admin to view waiver create form', function () {
    $this->actingAs($this->superAdmin)
        ->get(route('waivers.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('waivers/create'));
});

it('blocks staff from creating waivers', function () {
    $this->actingAs($this->staffUser)
        ->get(route('waivers.create'))
        ->assertForbidden();
});

it('applies a waiver to an unpaid invoice and updates status', function () {
    $deceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-WAIVER-01',
        'total_amount' => 1000.00,
        'paid_amount' => 0.00,
        'waived_amount' => 0.00,
        'status' => 'Unpaid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 300.00,
            'reason' => 'Humanitarian concession',
        ])
        ->assertRedirect();

    $invoice->refresh();
    expect($invoice->waived_amount)->toEqual(300.00);
    expect($invoice->status)->toEqual('Partially Paid');
});

it('marks invoice as paid when waiver covers full balance', function () {
    $deceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-WAIVER-02',
        'total_amount' => 500.00,
        'paid_amount' => 0.00,
        'waived_amount' => 0.00,
        'status' => 'Unpaid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 500.00,
            'reason' => 'Full waiver',
        ])
        ->assertRedirect();

    $invoice->refresh();
    expect($invoice->waived_amount)->toEqual(500.00);
    expect($invoice->status)->toEqual('Paid');
});

it('rejects waiver that exceeds outstanding balance', function () {
    $deceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-WAIVER-03',
        'total_amount' => 500.00,
        'paid_amount' => 0.00,
        'waived_amount' => 0.00,
        'status' => 'Unpaid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 600.00,
            'reason' => 'Too much',
        ])
        ->assertSessionHasErrors('amount');
});

it('rejects waiver for fully paid invoice', function () {
    $deceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-WAIVER-04',
        'total_amount' => 500.00,
        'paid_amount' => 500.00,
        'waived_amount' => 0.00,
        'status' => 'Paid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 100.00,
            'reason' => 'No balance',
        ])
        ->assertSessionHasErrors('amount');
});

it('prevents applying waiver from a different deceased record', function () {
    $deceased = Deceased::factory()->create();
    $otherDeceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $otherDeceased->id,
        'invoice_number' => 'INV-WAIVER-05',
        'total_amount' => 500.00,
        'paid_amount' => 0.00,
        'waived_amount' => 0.00,
        'status' => 'Unpaid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 100.00,
            'reason' => 'Wrong deceased',
        ])
        ->assertSessionHasErrors('invoice_id');
});

it('records activity log when waiver is created', function () {
    $deceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-WAIVER-06',
        'total_amount' => 1000.00,
        'paid_amount' => 0.00,
        'waived_amount' => 0.00,
        'status' => 'Unpaid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 200.00,
            'reason' => 'Discount applied',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('waivers', [
        'invoice_id' => $invoice->id,
        'deceased_id' => $deceased->id,
        'amount' => 200.00,
        'reason' => 'Discount applied',
        'authorized_by' => $this->superAdmin->id,
    ]);
});

it('allows partial waiver on partially paid invoice', function () {
    $deceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-WAIVER-07',
        'total_amount' => 1000.00,
        'paid_amount' => 400.00,
        'waived_amount' => 0.00,
        'status' => 'Partially Paid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 200.00,
            'reason' => 'Partial concession',
        ])
        ->assertRedirect();

    $invoice->refresh();
    expect($invoice->waived_amount)->toEqual(200.00);
    expect($invoice->status)->toEqual('Partially Paid');
});

it('can view a single waiver', function () {
    $deceased = Deceased::factory()->create();

    $invoice = Invoice::create([
        'deceased_id' => $deceased->id,
        'invoice_number' => 'INV-WAIVER-08',
        'total_amount' => 500.00,
        'paid_amount' => 0.00,
        'waived_amount' => 0.00,
        'status' => 'Unpaid',
        'created_by' => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('waivers.store'), [
            'deceased_id' => $deceased->id,
            'invoice_id' => $invoice->id,
            'amount' => 150.00,
            'reason' => 'Test waiver',
        ]);

    $waiver = Waiver::where('invoice_id', $invoice->id)->first();

    $this->actingAs($this->superAdmin)
        ->get(route('waivers.show', $waiver))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('waiver')
            ->where('waiver.amount', 150)
        );
});

it('blocks unauthorized users from viewing waivers', function () {
    $noPermUser = User::factory()->create();
    $noRole = Role::firstOrCreate(['name' => 'no-perms']);
    $noPermUser->assignRole($noRole);

    $this->actingAs($noPermUser)
        ->get(route('waivers.index'))
        ->assertForbidden();
});
