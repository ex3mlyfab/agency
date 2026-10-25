<?php

use App\Actions\IssueRefund;
use App\Actions\RecordPayment;
use App\Enums\DeceasedStatus;
use App\Models\Branch;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Payment;
use App\Models\PaymentMode;
use App\Models\User;
use App\Support\DocumentNumber;

beforeEach(function () {
    $this->paymentMode = PaymentMode::firstOrCreate(
        ['name' => 'Cash'],
        ['is_active' => true],
    );

    $this->actor = User::factory()->create();
    $this->actorId = (string) $this->actor->id;
});

it('prefixes document numbers with the supplied branch slug', function () {
    expect(DocumentNumber::invoice('main'))->toStartWith('INV-MAIN-')
        ->and(DocumentNumber::storage('main'))->toStartWith('STO-MAIN-')
        ->and(DocumentNumber::receipt('main'))->toStartWith('REC-MAIN-')
        ->and(DocumentNumber::refundInvoice('main'))->toStartWith('RFD-MAIN-')
        ->and(DocumentNumber::refund('main'))->toStartWith('REF-MAIN-');
});

it('falls back to the default branch slug when none is supplied', function () {
    // The default "Main" branch is seeded by the migration itself.
    expect(Branch::where('slug', 'main')->exists())->toBeTrue();

    expect(DocumentNumber::invoice())->toStartWith('INV-MAIN-');
});

it('passes an explicit empty slug through to the default branch', function () {
    expect(DocumentNumber::invoice(''))->toStartWith('INV-MAIN-');
});

it('records payments with the branch slug prefix of the deceased chamber branch', function () {
    $branch = Branch::factory()->create(['slug' => 'ikeja']);
    $chamber = Chamber::factory()->create(['branch_id' => $branch->id, 'capacity' => 2]);
    $deceased = Deceased::factory()->create([
        'chamber_id' => $chamber->id,
        'status' => DeceasedStatus::InChamber,
    ]);

    $payment = (new RecordPayment)->handle([
        'deceased_id' => $deceased->id,
        'payment_mode_id' => $this->paymentMode->id,
        'amount' => 100.0,
        'payment_date' => now()->toDateString(),
    ], (string) $this->actor->id);

    expect($payment->receipt_number)->toStartWith('REC-IKEJA-');
});

it('records deposits to the default branch when the deceased has no chamber', function () {
    Deceased::factory()->create(['status' => DeceasedStatus::Pending]);

    $payment = (new RecordPayment)->handle([
        'deceased_id' => Deceased::first()->id,
        'payment_mode_id' => $this->paymentMode->id,
        'amount' => 50.0,
        'payment_date' => now()->toDateString(),
    ], (string) $this->actor->id);

    expect($payment->receipt_number)->toStartWith('REC-MAIN-');
});

it('issues refunds with the branch slug prefix', function () {
    $branch = Branch::factory()->create(['slug' => 'ikeja']);
    $chamber = Chamber::factory()->create(['branch_id' => $branch->id, 'capacity' => 2]);
    $deceased = Deceased::factory()->create([
        'chamber_id' => $chamber->id,
        'status' => DeceasedStatus::InChamber,
    ]);

    $refund = (new IssueRefund)->handle($deceased->id, 25.0, (string) $this->actor->id, 'Test refund');

    $refundReceipt = Payment::where('deceased_id', $deceased->id)->first();

    expect($refund->invoice_number)->toStartWith('RFD-IKEJA-')
        ->and($refundReceipt->receipt_number)->toStartWith('REF-IKEJA-');
});
