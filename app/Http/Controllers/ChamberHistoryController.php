<?php

namespace App\Http\Controllers;

use App\Models\Chamber;
use App\Models\Transfer;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ChamberHistoryController extends Controller
{
    /**
     * Show the occupation history for a given chamber.
     */
    public function index(Chamber $chamber): Response
    {
        Gate::authorize('history.view');

        $history = Transfer::with(['deceased', 'fromChamber', 'toChamber', 'transferredByUser'])
            ->where(function ($query) use ($chamber) {
                $query->where('from_chamber_id', $chamber->id)
                    ->orWhere('to_chamber_id', $chamber->id);
            })
            ->latest('transferred_at')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('chambers/history', [
            'chamber' => $chamber,
            'history' => $history,
        ]);
    }
}
