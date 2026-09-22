<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChamberRequest;
use App\Http\Requests\UpdateChamberRequest;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ChamberController extends Controller
{
    /**
     * Display the chamber indicator index.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('chambers.view');

        $query = Chamber::with(['service'])->withCount(['occupants']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->input('status') === 'occupied') {
                $query->havingRaw('occupants_count > 0');
            } elseif ($request->input('status') === 'empty') {
                $query->havingRaw('occupants_count = 0');
            }
        }

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->input('service_id'));
        }

        $chambers = $query
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Chamber $ch) => [
                'id' => $ch->id,
                'name' => $ch->name,
                'location' => $ch->location,
                'capacity' => $ch->capacity,
                'occupants_count' => $ch->occupants_count,
                'occupancy_status' => $ch->occupancy_status,
                'days_in_chamber' => $ch->days_in_chamber,
                'service_id' => $ch->service_id,
                'service' => $ch->service ? ['id' => $ch->service->id, 'name' => $ch->service->name] : null,
            ]);

        $services = Service::orderBy('name')->get(['id', 'name']);

        $queryForStats = Chamber::with(['service'])->withCount(['occupants']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $queryForStats->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->input('status') === 'occupied') {
                $queryForStats->havingRaw('occupants_count > 0');
            } elseif ($request->input('status') === 'empty') {
                $queryForStats->havingRaw('occupants_count = 0');
            }
        }

        if ($request->filled('service_id')) {
            $queryForStats->where('service_id', $request->input('service_id'));
        }

        $stats = $queryForStats->get()->reduce(fn ($carry, Chamber $ch) => [
            'total' => $carry['total'] + 1,
            'occupied' => $carry['occupied'] + ($ch->occupancy_status === 'In use' ? 1 : 0),
            'totalSlots' => $carry['totalSlots'] + $ch->capacity,
            'usedSlots' => $carry['usedSlots'] + $ch->occupants_count,
        ], ['total' => 0, 'occupied' => 0, 'totalSlots' => 0, 'usedSlots' => 0]);
        $stats['empty'] = $stats['total'] - $stats['occupied'];
        $stats['freeSlots'] = $stats['totalSlots'] - $stats['usedSlots'];

        return Inertia::render('chambers/index', [
            'chambers' => $chambers,
            'services' => $services,
            'stats' => $stats,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'service_id' => $request->input('service_id'),
            ],
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

        return Inertia::render('chambers/create', [
            'services' => Service::orderBy('name')->get(['id', 'name']),
        ]);
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
            'services' => Service::orderBy('name')->get(['id', 'name']),
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
     * Display all occupied chambers with their deceased occupants.
     */
    public function deposers(): Response
    {
        Gate::authorize('chambers.view');

        $chambers = Chamber::with(['service', 'occupants'])
            ->withCount(['occupants'])
            ->havingRaw('occupants_count > 0')
            ->orderBy('name')
            ->get()
            ->map(function (Chamber $chamber) {
                $occupants = $chamber->occupants->map(function (Deceased $d) {
                    return [
                        'id' => $d->id,
                        'full_name' => $d->full_name,
                        'age' => $d->date_of_birth
                            ? (int) $d->date_of_birth->diffInYears(now())
                            : null,
                        'days_in_storage' => $d->days_in_storage,
                    ];
                });

                return [
                    'id' => $chamber->id,
                    'name' => $chamber->name,
                    'location' => $chamber->location,
                    'capacity' => $chamber->capacity,
                    'occupants_count' => $chamber->occupants_count,
                    'occupancy_status' => $chamber->occupancy_status,
                    'service' => $chamber->service
                        ? ['id' => $chamber->service->id, 'name' => $chamber->service->name]
                        : null,
                    'occupants' => $occupants,
                ];
            });

        return Inertia::render('chambers/deposers', [
            'chambers' => $chambers,
        ]);
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
