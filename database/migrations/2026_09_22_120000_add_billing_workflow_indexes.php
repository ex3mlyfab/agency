<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add composite indexes for common billing, release gate, and filter queries.
     */
    public function up(): void
    {
        // Deceased: status is filtered on every dashboard and release-gate check.
        Schema::table('deceased', function (Blueprint $table) {
            if (! Schema::hasIndex('deceased', 'deceased_status_index')) {
                $table->index('status', 'deceased_status_index');
            }
        });

        // Invoices: release gate and paid/partial blocks always query by deceased + status.
        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasIndex('invoices', 'invoices_deceased_status_index')) {
                $table->index(['deceased_id', 'status'], 'invoices_deceased_status_index');
            }
        });

        // Transfers: currentAdmissionStart() queries event_type + transferred_at.
        Schema::table('transfers', function (Blueprint $table) {
            if (! Schema::hasIndex('transfers', 'transfers_event_type_index')) {
                $table->index(['event_type', 'transferred_at'], 'transfers_event_type_index');
            }
        });

        // ServicePrices: invoice-item loop filters on (service_id, service_category_id, source).
        Schema::table('service_prices', function (Blueprint $table) {
            if (! Schema::hasIndex('service_prices', 'service_prices_lookup_index')) {
                $table->index(['service_id', 'service_category_id', 'source'], 'service_prices_lookup_index');
            }
        });

        // Payments: wallet balance queries filter by deceased + invoice_id IS NULL.
        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasIndex('payments', 'payments_deceased_invoice_index')) {
                $table->index(['deceased_id', 'invoice_id'], 'payments_deceased_invoice_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('deceased', function (Blueprint $table) {
            $table->dropIndex('deceased_status_index');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_deceased_status_index');
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->dropIndex('transfers_event_type_index');
        });

        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropIndex('service_prices_lookup_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_deceased_invoice_index');
        });
    }
};
