<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\PaymentMode;
use App\Models\User;
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
        $status = $request->input('status');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $createdBy = $request->input('created_by');

        $query = Invoice::with(['deceased:id,first_name,last_name', 'createdByUser:id,name']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('deceased', function ($sub) use ($search) {
                        $sub->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($createdBy) {
            $query->where('created_by', $createdBy);
        }

        $invoices = $query->latest()
            ->paginate(15)
            ->withQueryString();

        $summary = Invoice::selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN status = \'Paid\' THEN 1 ELSE 0 END) as paid_count,
            SUM(CASE WHEN status = \'Unpaid\' THEN 1 ELSE 0 END) as unpaid_count,
            SUM(CASE WHEN status = \'Partially Paid\' THEN 1 ELSE 0 END) as partially_paid_count,
            SUM(CASE WHEN status = \'Paid\' THEN total_amount ELSE 0 END) as paid_total,
            SUM(CASE WHEN status = \'Unpaid\' THEN (total_amount - paid_amount) ELSE 0 END) as unpaid_balance,
            SUM(CASE WHEN status = \'Partially Paid\' THEN (total_amount - paid_amount) ELSE 0 END) as partial_balance
        ')->first();

        $statuses = ['Draft', 'Unpaid', 'Partially Paid', 'Paid'];

        $creators = User::select('id', 'name')
            ->whereIn('id', Invoice::distinct()->pluck('created_by'))
            ->orderBy('name')
            ->get();

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'created_by']),
            'summary' => [
                'total_invoices' => (int) $summary->total,
                'paid' => [
                    'count' => (int) $summary->paid_count,
                    'total' => (float) $summary->paid_total,
                ],
                'unpaid' => [
                    'count' => (int) $summary->unpaid_count,
                    'balance' => (float) $summary->unpaid_balance,
                ],
                'partially_paid' => [
                    'count' => (int) $summary->partially_paid_count,
                    'balance' => (float) $summary->partial_balance,
                ],
            ],
            'statuses' => $statuses,
            'creators' => $creators,
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
