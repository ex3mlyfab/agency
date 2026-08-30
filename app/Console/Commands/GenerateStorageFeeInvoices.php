<?php

namespace App\Console\Commands;

use App\Actions\CreateStorageFeeInvoice;
use App\Models\Deceased;
use Illuminate\Console\Command;

class GenerateStorageFeeInvoices extends Command
{
    protected $signature = 'storage:generate-storage-invoices';

    protected $description = 'Generate storage fee invoices for deceased records where storage days are unpaid';

    public function handle(): int
    {
        $createdCount = 0;
        $skippedCount = 0;

        $deceased = Deceased::where('status', 'InChamber')
            ->whereNotNull('chamber_id')
            ->get();

        $action = app(CreateStorageFeeInvoice::class);

        foreach ($deceased as $record) {
            $invoice = $action->handle($record, auth()->id() ?? '000000000000000000000000');

            if ($invoice) {
                $createdCount++;
                $this->info("Created storage invoice {$invoice->invoice_number} for {$record->first_name} {$record->last_name}");
            } else {
                $skippedCount++;
            }
        }

        $this->info("Storage invoice generation complete. Created: {$createdCount}, Skipped: {$skippedCount}");

        return Command::SUCCESS;
    }
}
