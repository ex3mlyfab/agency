<?php

namespace App\Http\Controllers;

use App\Actions\RecordPayment;
use App\Http\Requests\StorePaymentRequest;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
    public function store(StorePaymentRequest $request, RecordPayment $recordPayment): RedirectResponse
    {
        $recordPayment->handle($request->validated(), (string) $request->user()->id);

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
