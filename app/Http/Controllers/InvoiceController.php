<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\PaymentMode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('invoices.view');

        $search = $request->input('search');

        $invoices = Invoice::with('deceased')
            ->when($search, function ($query, $search) {
                $query->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('deceased', function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'filters' => $request->only('search'),
            'can' => [
                'manage' => auth()->user()?->can('invoices.manage'),
            ],
        ]);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice): Response
    {
        Gate::authorize('invoices.view');

        $invoice->load(['deceased', 'invoiceItems.service', 'payments', 'createdByUser']);
        $paymentModes = PaymentMode::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('invoices/show', [
            'invoice' => $invoice,
            'paymentModes' => $paymentModes,
            'can' => [
                'managePayments' => auth()->user()?->can('payments.manage'),
            ],
        ]);
    }
}
