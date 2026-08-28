<?php

namespace App\Http\Controllers;

use App\Actions\RecordTransfer;
use App\Http\Requests\StoreTransferRequest;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    /**
     * Display the transfer history log.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('transfers.view');

        $query = Transfer::with([
            'deceased',
            'fromChamber',
            'toChamber',
            'transferredByUser',
        ]);

        if ($request->filled('event_type') && $request->event_type !== 'all') {
            $query->where('event_type', $request->event_type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('transferred_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('transferred_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('deceased', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $transfers = $query
            ->latest('transferred_at')
            ->paginate(25)
            ->withQueryString();

        $stats = [
            'total' => Transfer::count(),
            'entered' => Transfer::where('event_type', 'Entered')->count(),
            'transferred' => Transfer::where('event_type', 'Transferred')->count(),
            'released' => Transfer::where('event_type', 'Released')->count(),
        ];

        $allUsers = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transfers/index', [
            'transfers' => $transfers,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'event_type' => $request->event_type ?? 'all',
                'date_from' => $request->date_from ?? '',
                'date_to' => $request->date_to ?? '',
            ],
            'users' => $allUsers,
            'can' => [
                'create' => auth()->user()?->can('transfers.create') ?? false,
            ],
        ]);
    }

    /**
     * Show the transfer creation form.
     */
    public function create(): Response
    {
        Gate::authorize('transfers.create');

        $deceasedOptions = Deceased::whereIn('status', ['Pending', 'InChamber'])
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'status', 'chamber_id']);

        $chamberOptions = Chamber::orderBy('name')->get(['id', 'name', 'location']);

        return Inertia::render('transfers/create', [
            'deceasedOptions' => $deceasedOptions,
            'chamberOptions' => $chamberOptions,
        ]);
    }

    /**
     * Store a new transfer event.
     */
    public function store(StoreTransferRequest $request, RecordTransfer $recordTransfer): RedirectResponse
    {
        $deceased = $recordTransfer->handle($request->validated(), (string) $request->user()->id);

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', ['type' => 'success', 'message' => 'Transfer recorded successfully.']);
    }
}
