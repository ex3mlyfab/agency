<?php

namespace App\Http\Controllers;

use App\Actions\ApplyWaiver;
use App\Http\Requests\StoreWaiverRequest;
use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Waiver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WaiverController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('waivers.view');

        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $authorizedBy = $request->input('authorized_by');

        $query = Waiver::with(['deceased:id,first_name,last_name', 'invoice', 'authorizedBy:id,name']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reason', 'like', "%{$search}%")
                    ->orWhereHas('invoice', function ($sub) use ($search) {
                        $sub->where('invoice_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('deceased', function ($sub) use ($search) {
                        $sub->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($dateFrom) {
            $query->whereDate('authorized_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('authorized_at', '<=', $dateTo);
        }

        if ($authorizedBy) {
            $query->where('authorized_by', $authorizedBy);
        }

        $waivers = $query->latest()
            ->paginate(15)
            ->withQueryString();

        $summary = Waiver::selectRaw('
            COUNT(*) as total,
            SUM(amount) as total_waived,
            COUNT(DISTINCT invoice_id) as invoices_affected,
            COUNT(DISTINCT deceased_id) as deceased_affected
        ')->first();

        $authorizers = User::select('id', 'name')
            ->whereIn('id', Waiver::distinct()->pluck('authorized_by'))
            ->orderBy('name')
            ->get();

        return Inertia::render('waivers/index', [
            'waivers' => $waivers,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'authorized_by']),
            'summary' => [
                'total_waivers' => (int) $summary->total,
                'total_waived' => (float) $summary->total_waived,
                'invoices_affected' => (int) $summary->invoices_affected,
                'deceased_affected' => (int) $summary->deceased_affected,
            ],
            'authorizers' => $authorizers,
            'can' => [
                'manage' => auth()->user()?->can('waivers.manage'),
            ],
        ]);
    }

    public function show(Waiver $waiver): Response
    {
        Gate::authorize('waivers.view');

        $waiver->load(['deceased', 'invoice', 'authorizedBy']);

        return Inertia::render('waivers/show', [
            'waiver' => $waiver,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('waivers.manage');

        $deceasedList = Deceased::select('id', 'first_name', 'last_name')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $invoices = Invoice::select('id', 'deceased_id', 'invoice_number', 'total_amount', 'paid_amount', 'waived_amount', 'status')
            ->whereIn('status', ['Unpaid', 'Partially Paid'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('waivers/create', [
            'deceasedList' => $deceasedList,
            'invoices' => $invoices,
        ]);
    }

    public function store(StoreWaiverRequest $request, ApplyWaiver $applyWaiver): RedirectResponse
    {
        Gate::authorize('waivers.manage');

        $waiver = $applyWaiver->handle($request->validated(), (string) $request->user()->id);

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Waiver applied successfully.',
        ]);
    }
}
