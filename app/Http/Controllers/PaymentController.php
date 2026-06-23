<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('payments.view');

        $search = $request->input('search');
        $period = $request->input('period');
        $paymentMethod = $request->input('payment_method');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $perPage = (int) $request->input('per_page', 15);
        $sortBy = $request->input('sort_by', 'payment_date');
        $sortDir = $request->input('sort_dir', 'desc');

        $allowedSorts = ['payment_date', 'amount', 'receipt_number', 'payment_method'];
        if (! in_array($sortBy, $allowedSorts)) {
            $sortBy = 'payment_date';
        }
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        // Resolve period preset into date range
        [$resolvedFrom, $resolvedTo] = $this->resolvePeriod($period, $dateFrom, $dateTo);

        $baseQuery = Payment::with(['deceased', 'invoice', 'paymentMode'])
            ->when($search, function ($query, $search) {
                $query->where('receipt_number', 'like', "%{$search}%")
                    ->orWhere('transaction_reference', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhereHas('deceased', function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            })
            ->when($paymentMethod, fn ($q) => $q->where('payment_method', $paymentMethod))
            ->when($resolvedFrom, fn ($q) => $q->whereDate('payment_date', '>=', $resolvedFrom))
            ->when($resolvedTo, fn ($q) => $q->whereDate('payment_date', '<=', $resolvedTo));

        // Aggregate stats — clone query before paginating
        $statsQuery = clone $baseQuery;
        $totalAmount = (clone $statsQuery)->sum('amount');
        $totalCount = (clone $statsQuery)->count();
        $depositCount = (clone $statsQuery)->whereNull('invoice_id')->count();

        /** @var array<string, float> $byMethod */
        $byMethod = (clone $statsQuery)
            ->select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method')
            ->toArray();

        $payments = $baseQuery
            ->orderBy($sortBy, $sortDir)
            ->paginate(in_array($perPage, [15, 25, 50]) ? $perPage : 15)
            ->withQueryString();

        // Distinct payment methods for the filter dropdown
        $paymentMethods = Payment::distinct()->orderBy('payment_method')->pluck('payment_method');

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => $request->only(['search', 'period', 'date_from', 'date_to', 'payment_method', 'per_page', 'sort_by', 'sort_dir']),
            'stats' => [
                'total_amount' => (float) $totalAmount,
                'total_count' => $totalCount,
                'deposit_count' => $depositCount,
                'invoice_count' => $totalCount - $depositCount,
                'by_method' => $byMethod,
            ],
            'paymentMethods' => $paymentMethods,
            'can' => [
                'manage' => auth()->user()?->can('payments.manage'),
            ],
        ]);
    }

    /**
     * Resolve a period preset or raw date range into [from, to] Carbon strings.
     *
     * @return array{string|null, string|null}
     */
    private function resolvePeriod(?string $period, ?string $dateFrom, ?string $dateTo): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today' => [$now->toDateString(), $now->toDateString()],
            'this_week' => [$now->startOfWeek()->toDateString(), $now->copy()->endOfWeek()->toDateString()],
            'this_month' => [$now->copy()->startOfMonth()->toDateString(), $now->copy()->endOfMonth()->toDateString()],
            'this_quarter' => [$now->copy()->startOfQuarter()->toDateString(), $now->copy()->endOfQuarter()->toDateString()],
            'this_year' => [$now->copy()->startOfYear()->toDateString(), $now->copy()->endOfYear()->toDateString()],
            'last_month' => [
                $now->copy()->subMonth()->startOfMonth()->toDateString(),
                $now->copy()->subMonth()->endOfMonth()->toDateString(),
            ],
            'last_quarter' => [
                $now->copy()->subQuarter()->startOfQuarter()->toDateString(),
                $now->copy()->subQuarter()->endOfQuarter()->toDateString(),
            ],
            default => [$dateFrom ?: null, $dateTo ?: null],
        };
    }

    /**
     * Store a newly created payment in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('payments.manage');

        $validated = $request->validate([
            'deceased_id' => ['required', 'exists:deceased,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'payment_mode_id' => ['required', 'exists:payment_modes,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'transaction_reference' => ['nullable', 'string', 'max:100'],
            'payment_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // Get the payment mode name as fallback/legacy support for the payment_method column
        $paymentMode = PaymentMode::findOrFail($validated['payment_mode_id']);

        DB::transaction(function () use ($validated, $paymentMode) {
            // Generate unique receipt number
            $receiptNumber = 'REC-'.strtoupper(Str::random(8));
            while (Payment::where('receipt_number', $receiptNumber)->exists()) {
                $receiptNumber = 'REC-'.strtoupper(Str::random(8));
            }

            // Create Payment
            $payment = Payment::create([
                'deceased_id' => $validated['deceased_id'],
                'invoice_id' => $validated['invoice_id'] ?? null,
                'payment_mode_id' => $validated['payment_mode_id'],
                'payment_method' => $paymentMode->name, // Keep sync for legacy payment_method column
                'receipt_number' => $receiptNumber,
                'amount' => $validated['amount'],
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'payment_date' => $validated['payment_date'],
                'notes' => $validated['notes'] ?? null,
                'received_by' => auth()->id(),
            ]);

            // If linked to an invoice, update invoice paid amount and status
            if (! empty($validated['invoice_id'])) {
                $invoice = Invoice::findOrFail($validated['invoice_id']);

                // Recalculate total paid on the invoice
                $totalPaidOnInvoice = $invoice->payments()->sum('amount');
                $invoice->paid_amount = $totalPaidOnInvoice;

                // Adjust status based on new paid amount
                if ($invoice->paid_amount >= $invoice->total_amount) {
                    $invoice->status = 'Paid';
                } elseif ($invoice->paid_amount > 0) {
                    $invoice->status = 'Partially Paid';
                } else {
                    $invoice->status = 'Unpaid';
                }

                $invoice->save();
            }
        });

        return back()->with('flash', ['type' => 'success', 'message' => 'Payment recorded successfully.']);
    }

    /**
     * Display the specified payment.
     */
    public function show(Payment $payment): Response
    {
        Gate::authorize('payments.view');

        $payment->load(['deceased', 'invoice', 'receivedByUser', 'paymentMode']);

        return Inertia::render('payments/show', [
            'payment' => $payment,
        ]);
    }
}
