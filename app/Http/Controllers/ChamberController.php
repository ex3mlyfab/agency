<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChamberRequest;
use App\Http\Requests\UpdateChamberRequest;
use App\Models\Chamber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ChamberController extends Controller
{
    /**
     * Display the chamber indicator index.
     */
    public function index(): Response
    {
        Gate::authorize('chambers.view');

        $chambers = Chamber::withCount(['occupants'])
            ->get()
            ->map(function (Chamber $chamber) {
                return [
                    'id' => $chamber->id,
                    'name' => $chamber->name,
                    'location' => $chamber->location,
                    'capacity' => $chamber->capacity,
                    'occupants_count' => $chamber->occupants_count,
                    'occupancy_status' => $chamber->occupancy_status,
                    'days_in_chamber' => $chamber->days_in_chamber,
                ];
            });

        return Inertia::render('chambers/index', [
            'chambers' => $chambers,
            'can' => [
                'manage' => auth()->user()?->can('chambers.manage'),
                'viewHistory' => auth()->user()?->can('history.view'),
                'transfer' => auth()->user()?->can('transfers.create'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new chamber.
     */
    public function create(): Response
    {
        Gate::authorize('chambers.manage');

        return Inertia::render('chambers/create');
    }

    /**
     * Store a newly created chamber.
     */
    public function store(StoreChamberRequest $request): RedirectResponse
    {
        Chamber::create($request->validated());

        return redirect()->route('chambers.index')
            ->with('flash', ['type' => 'success', 'message' => 'Chamber created successfully.']);
    }

    /**
     * Show the form for editing a chamber.
     */
    public function edit(Chamber $chamber): Response
    {
        Gate::authorize('chambers.manage');

        return Inertia::render('chambers/edit', [
            'chamber' => $chamber,
        ]);
    }

    /**
     * Update the specified chamber.
     */
    public function update(UpdateChamberRequest $request, Chamber $chamber): RedirectResponse
    {
        $chamber->update($request->validated());

        return redirect()->route('chambers.index')
            ->with('flash', ['type' => 'success', 'message' => 'Chamber updated.']);
    }

    /**
     * Remove the specified chamber.
     */
    public function destroy(Chamber $chamber): RedirectResponse
    {
        Gate::authorize('chambers.manage');

        if ($chamber->occupants()->exists()) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Cannot delete a chamber that is currently occupied.',
            ]);
        }

        $chamber->delete();

        return redirect()->route('chambers.index')
            ->with('flash', ['type' => 'success', 'message' => 'Chamber deleted.']);
    }
}
