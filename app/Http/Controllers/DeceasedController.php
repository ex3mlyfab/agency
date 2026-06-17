<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDeceasedRequest;
use App\Http\Requests\UpdateDeceasedRequest;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Transfer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DeceasedController extends Controller
{
    /**
     * Display a listing of deceased records.
     */
    public function index(): Response
    {
        Gate::authorize('deceased.view');

        $deceased = Deceased::with('chamber')
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('deceased/index', [
            'deceased' => $deceased,
            'can' => [
                'create' => auth()->user()?->can('deceased.create'),
                'edit' => auth()->user()?->can('deceased.edit'),
                'delete' => auth()->user()?->can('deceased.delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new deceased record.
     */
    public function create(): Response
    {
        Gate::authorize('deceased.create');

        return Inertia::render('deceased/create', [
            'chambers' => Chamber::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created deceased record.
     */
    public function store(StoreDeceasedRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $storedAt = $data['stored_at'] ?? null;
        unset($data['stored_at']);

        if ($request->hasFile('picture')) {
            $data['picture'] = $request->file('picture')->store('deceased_pictures', 'public');
        }

        if (! empty($data['chamber_id'])) {
            $data['status'] = 'InChamber';
        }

        $deceased = Deceased::create($data);

        if (! empty($data['chamber_id'])) {
            Transfer::create([
                'deceased_id' => $deceased->id,
                'to_chamber_id' => $data['chamber_id'],
                'transferred_by' => auth()->id(),
                'event_type' => 'Entered',
                'transferred_at' => $storedAt ?? now(),
            ]);
        }

        return redirect()->route('deceased.index')
            ->with('flash', ['type' => 'success', 'message' => 'Deceased record created successfully.']);
    }

    /**
     * Display the specified deceased record.
     */
    public function show(Deceased $deceased): Response
    {
        Gate::authorize('deceased.view');

        $deceased->load(['chamber', 'releasedByUser', 'transfers.fromChamber', 'transfers.toChamber', 'transfers.transferredByUser']);

        return Inertia::render('deceased/show', [
            'deceased' => $deceased,
            'can' => [
                'edit' => auth()->user()?->can('deceased.edit'),
                'delete' => auth()->user()?->can('deceased.delete'),
                'transfer' => auth()->user()?->can('transfers.create'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified deceased record.
     */
    public function edit(Deceased $deceased): Response
    {
        Gate::authorize('deceased.edit');

        return Inertia::render('deceased/edit', [
            'deceased' => $deceased,
            'chambers' => Chamber::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified deceased record.
     */
    public function update(UpdateDeceasedRequest $request, Deceased $deceased): RedirectResponse
    {
        $data = $request->validated();

        $storedAt = $data['stored_at'] ?? null;
        unset($data['stored_at']);

        if ($request->hasFile('picture')) {
            if ($deceased->picture) {
                Storage::disk('public')->delete($deceased->picture);
            }
            $data['picture'] = $request->file('picture')->store('deceased_pictures', 'public');
        }

        // Handle chamber change
        if (array_key_exists('chamber_id', $data) && $data['chamber_id'] !== $deceased->chamber_id) {
            $oldChamberId = $deceased->chamber_id;
            $newChamberId = $data['chamber_id'];

            if ($newChamberId) {
                $data['status'] = 'InChamber';
                Transfer::create([
                    'deceased_id' => $deceased->id,
                    'from_chamber_id' => $oldChamberId,
                    'to_chamber_id' => $newChamberId,
                    'transferred_by' => auth()->id(),
                    'event_type' => $oldChamberId ? 'Transferred' : 'Entered',
                    'transferred_at' => $storedAt ?? now(),
                ]);
            } elseif ($oldChamberId) {
                $data['status'] = 'Released';
                Transfer::create([
                    'deceased_id' => $deceased->id,
                    'from_chamber_id' => $oldChamberId,
                    'to_chamber_id' => null,
                    'transferred_by' => auth()->id(),
                    'event_type' => 'Released',
                    'transferred_at' => $storedAt ?? now(),
                ]);
            }
        }

        $deceased->update($data);

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', ['type' => 'success', 'message' => 'Deceased record updated.']);
    }

    /**
     * Remove the specified deceased record.
     */
    public function destroy(Deceased $deceased): RedirectResponse
    {
        Gate::authorize('deceased.delete');

        if ($deceased->picture) {
            Storage::disk('public')->delete($deceased->picture);
        }

        $deceased->delete();

        return redirect()->route('deceased.index')
            ->with('flash', ['type' => 'success', 'message' => 'Deceased record deleted.']);
    }

    /**
     * Show the deceased release verification form.
     */
    public function showReleaseForm(Deceased $deceased): Response|RedirectResponse
    {
        Gate::authorize('deceased.edit');

        if ($deceased->status === 'Released') {
            return redirect()->route('deceased.show', $deceased)
                ->with('flash', ['type' => 'error', 'message' => 'Deceased has already been released.']);
        }

        $deceased->load('chamber');

        return Inertia::render('deceased/release', [
            'deceased' => $deceased,
        ]);
    }

    /**
     * Process the release of the deceased.
     */
    public function release(Request $request, Deceased $deceased): RedirectResponse
    {
        Gate::authorize('deceased.edit');

        if ($deceased->status === 'Released') {
            return redirect()->route('deceased.show', $deceased)
                ->with('flash', ['type' => 'error', 'message' => 'Deceased has already been released.']);
        }

        $validated = $request->validate([
            'release_code' => ['required', 'string', function ($attribute, $value, $fail) use ($deceased) {
                if (strtoupper($value) !== strtoupper($deceased->release_code)) {
                    $fail('The entered verification code is incorrect.');
                }
            }],
            'released_to_name' => ['required', 'string', 'max:150'],
            'released_to_phone' => ['required', 'string', 'max:30'],
            'released_to_relationship' => ['required', 'string', 'max:100'],
            'released_to_id_type' => ['required', 'string', 'in:National ID,Driver\'s License,Passport,Other'],
            'released_to_id_number' => ['required', 'string', 'max:50'],
            'release_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $oldChamberId = $deceased->chamber_id;

        $deceased->update([
            'status' => 'Released',
            'chamber_id' => null,
            'released_to_name' => $validated['released_to_name'],
            'released_to_phone' => $validated['released_to_phone'],
            'released_to_relationship' => $validated['released_to_relationship'],
            'released_to_id_type' => $validated['released_to_id_type'],
            'released_to_id_number' => $validated['released_to_id_number'],
            'released_at' => now(),
            'released_by' => auth()->id(),
        ]);

        Transfer::create([
            'deceased_id' => $deceased->id,
            'from_chamber_id' => $oldChamberId,
            'to_chamber_id' => null,
            'transferred_by' => auth()->id(),
            'event_type' => 'Released',
            'notes' => $validated['release_notes'] ?? ('Released to '.$validated['released_to_name'].' ('.$validated['released_to_relationship'].')'),
            'transferred_at' => now(),
        ]);

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', [
                'type' => 'success',
                'message' => 'Deceased has been released successfully and chamber capacity updated.',
            ]);
    }
}
