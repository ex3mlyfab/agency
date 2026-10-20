<?php

namespace Tests\Unit;

use App\Enums\DeceasedStatus;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\StorageFeeLog;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeceasedTest extends TestCase
{
    use RefreshDatabase;

    public function test_deceased_status_enum(): void
    {
        $deceased = Deceased::factory()->create();

        $this->assertTrue(DeceasedStatus::isValid($deceased->status));
        $this->assertContains($deceased->status, DeceasedStatus::values());
    }

    public function test_total_billed_calculates_correctly(): void
    {
        $chamber = Chamber::factory()->create();
        $user = User::factory()->create();

        $deceased = Deceased::factory()->create([
            'status' => DeceasedStatus::InChamber,
            'chamber_id' => $chamber->id,
        ]);

        // Create an Entered transfer so currentAdmissionStart() has a value
        Transfer::create([
            'deceased_id' => $deceased->id,
            'from_chamber_id' => null,
            'to_chamber_id' => $chamber->id,
            'transferred_by' => $user->id,
            'event_type' => 'Entered',
            'transferred_at' => now(),
        ]);

        // Create a service invoice
        $invoice = Invoice::factory()->create([
            'deceased_id' => $deceased->id,
            'total_amount' => 100.00,
            'paid_amount' => 0.00,
            'waived_amount' => 0.00,
            'billing_type' => 'service',
            'status' => 'Unpaid',
            'created_by' => $user->id,
        ]);

        // Create a storage invoice
        $storageInvoice = Invoice::factory()->create([
            'deceased_id' => $deceased->id,
            'total_amount' => 50.00,
            'paid_amount' => 0.00,
            'waived_amount' => 0.00,
            'billing_type' => 'storage',
            'status' => 'Unpaid',
            'created_by' => $user->id,
        ]);

        // Link storage invoice to a storage fee log matching the current admission
        $log = StorageFeeLog::factory()->create([
            'deceased_id' => $deceased->id,
            'invoice_id' => $storageInvoice->id,
            'amount' => 50.00,
            'admission_started_at' => now(), // matches the Entered transfer time
            'created_by' => $user->id,
        ]);

        $this->assertEquals(150.00, $deceased->total_billed);
    }

    public function test_total_paid_calculates_general_credits(): void
    {
        $deceased = Deceased::factory()->create();

        // Create a general credit (no invoice)
        $payment = Payment::factory()->create([
            'deceased_id' => $deceased->id,
            'amount' => 75.00,
            'invoice_id' => null,
        ]);

        $this->assertEquals(75.00, $deceased->total_paid);
    }

    public function test_lifetime_storage_outstanding_calculates_correctly(): void
    {
        $user = User::factory()->create();
        $deceased = Deceased::factory()->create();

        // Create a storage invoice that's been partially paid
        $storageInvoice = Invoice::factory()->create([
            'deceased_id' => $deceased->id,
            'total_amount' => 200.00,
            'paid_amount' => 50.00,
            'waived_amount' => 30.00,
            'billing_type' => 'storage',
            'status' => 'Partially Paid',
            'created_by' => $user->id,
        ]);

        StorageFeeLog::factory()->create([
            'deceased_id' => $deceased->id,
            'invoice_id' => $storageInvoice->id,
            'amount' => 200.00,
            'admission_started_at' => null, // Legacy log: counts toward any admission
            'created_by' => $user->id,
        ]);

        // Expected: 200 - 50 - 30 = 120 outstanding
        $this->assertEquals(120.00, $deceased->lifetimeStorageOutstanding());
    }
}
