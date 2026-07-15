<?php

namespace App\Http\Controllers;

use App\Actions\RecordTransfer;
use App\Http\Requests\StoreTransferRequest;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Transfer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    /**
     * Display the transfer history log.
     */
    public function index(): Response
    {
        Gate::authorize('transfers.view');

        $transfers = Transfer::with([
            'deceased',
            'fromChamber',
            'toChamber',
            'transferredByUser',
        ])
            ->latest('transferred_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('transfers/index', [
            'transfers' => $transfers,
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
