<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDeceasedRequest;
use App\Http\Requests\UpdateDeceasedRequest;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\PaymentMode;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\Transfer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

        $chambers = Chamber::orderBy('name')
            ->select(['id', 'name', 'capacity'])
            ->get()
            ->filter(function (Chamber $chamber) {
                return $chamber->occupants()->count() < $chamber->capacity;
            })
            ->map(function (Chamber $chamber) {
                return [
                    'id' => $chamber->id,
                    'name' => $chamber->name,
                    'available_spaces' => $chamber->capacity - $chamber->occupants()->count(),
                ];
            });

        return Inertia::render('deceased/create', [
            'chambers' => $chambers,
            'serviceCategories' => ServiceCategory::orderBy('name')->get(['id', 'name']),
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

        $deceased->load([
            'chamber',
            'releasedByUser',
            'transfers.fromChamber',
            'transfers.toChamber',
            'transfers.transferredByUser',
            'invoice.invoiceItems.service',
            'payments.receivedByUser',
        ]);

        $storageServiceId = $deceased->chamber?->service_id;

        $availableServices = ServicePrice::with('servicePriceTiers')
            ->where('service_category_id', $deceased->service_category_id)
            ->where(function ($query) use ($deceased) {
                $query->whereNull('source')
                    ->orWhere('source', $deceased->source);
            })
            ->get()
            ->map(function ($sp) use ($deceased) {
                $hasTiers = $sp->servicePriceTiers->isNotEmpty();
                $tieredPrice = $hasTiers ? $sp->calculateStorageCharge($deceased->days_in_storage) : null;

                return [
                    'service_id' => $sp->service_id,
                    'name' => $sp->service?->name ?? 'Unknown Service',
                    'price' => (float) $sp->price,
                    'tiered_price' => $tieredPrice !== null ? round($tieredPrice, 2) : null,
                    'has_tiers' => $hasTiers,
                ];
            });

        $paymentModes = PaymentMode::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('deceased/show', [
            'deceased' => $deceased,
            'availableServices' => $availableServices,
            'storageServiceId' => $storageServiceId,
            'paymentModes' => $paymentModes,
            'can' => [
                'edit' => auth()->user()?->can('deceased.edit'),
                'delete' => auth()->user()?->can('deceased.delete'),
                'transfer' => auth()->user()?->can('transfers.create'),
                'managePayments' => auth()->user()?->can('payments.manage'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified deceased record.
     */
    public function edit(Deceased $deceased): Response
    {
        Gate::authorize('deceased.edit');

        $chambers = Chamber::orderBy('name')
            ->select(['id', 'name', 'capacity'])
            ->get()
            ->filter(function (Chamber $chamber) use ($deceased) {
                if ($chamber->id === $deceased->chamber_id) {
                    return true;
                }

                return $chamber->occupants()->count() < $chamber->capacity;
            })
            ->map(function (Chamber $chamber) use ($deceased) {
                return [
                    'id' => $chamber->id,
                    'name' => $chamber->name,
                    'available_spaces' => $chamber->capacity - $chamber->occupants()->count(),
                    'is_current' => $chamber->id === $deceased->chamber_id,
                ];
            });

        return Inertia::render('deceased/edit', [
            'deceased' => $deceased,
            'chambers' => $chambers,
            'serviceCategories' => ServiceCategory::orderBy('name')->get(['id', 'name']),
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

        $deceased->load(['chamber', 'invoice']);

        return Inertia::render('deceased/release', [
            'deceased' => $deceased,
            'billing' => [
                'total_billed' => $deceased->total_billed,
                'total_paid' => $deceased->total_paid,
                'ledger_balance' => $deceased->ledger_balance,
                'is_settled' => $deceased->isBillSettled(),
                'can_bypass' => auth()->user()?->can('deceased.bypass-billing') ?? false,
            ],
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

        // Validate billing status
        if (! $deceased->isBillSettled() && ! $request->boolean('bypass_billing_restriction')) {
            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Cannot release deceased with outstanding balance of '.number_format($deceased->ledger_balance, 2).' without manager override.',
                ])
                ->withErrors(['billing' => 'Outstanding balance must be settled before release.']);
        }

        if (! $deceased->isBillSettled() && $request->boolean('bypass_billing_restriction')) {
            Gate::authorize('deceased.bypass-billing');
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

        DB::transaction(function () use ($deceased, $validated): void {
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
        });

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', [
                'type' => 'success',
                'message' => 'Deceased has been released successfully and chamber capacity updated.',
            ]);
    }

    /**
     * Store or update invoice for the deceased person.
     */
    public function saveInvoice(Request $request, Deceased $deceased): RedirectResponse
    {
        Gate::authorize('deceased.edit');

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'exists:services,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($validated, $deceased) {
            $invoice = $deceased->invoice;
            if (! $invoice) {
                $invoice = Invoice::create([
                    'deceased_id' => $deceased->id,
                    'invoice_number' => 'INV-'.strtoupper(Str::random(8)),
                    'subtotal' => 0.00,
                    'discount' => 0.00,
                    'tax' => 0.00,
                    'total_amount' => 0.00,
                    'paid_amount' => 0.00,
                    'status' => 'Unpaid',
                    'created_by' => auth()->id(),
                ]);
            }

            $invoice->invoiceItems()->delete();
            $subtotal = 0.0;
            $storageServiceId = $deceased->chamber?->service_id;
            $daysInStorage = $deceased->days_in_storage;

            foreach ($validated['items'] as $item) {
                $isStorageService = (bool) $storageServiceId && $item['service_id'] == $storageServiceId;

                $servicePrice = ServicePrice::where('service_id', $item['service_id'])
                    ->where('service_category_id', $deceased->service_category_id)
                    ->where(function ($query) use ($deceased) {
                        $query->whereNull('source')
                            ->orWhere('source', $deceased->source);
                    })
                    ->first();

                if ($isStorageService && $servicePrice && $servicePrice->servicePriceTiers->isNotEmpty()) {
                    $unitPrice = (float) $servicePrice->calculateStorageCharge($daysInStorage);
                    $totalPrice = $unitPrice;
                } else {
                    $unitPrice = $servicePrice ? (float) $servicePrice->price : 0.0;
                    $totalPrice = $unitPrice * $item['quantity'];
                }

                $serviceName = Service::find($item['service_id'])?->name ?? 'Unknown Service';
                $subtotal += $totalPrice;

                $invoice->invoiceItems()->create([
                    'service_id' => $item['service_id'],
                    'name' => $serviceName,
                    'unit_price' => $unitPrice,
                    'quantity' => $isStorageService ? $daysInStorage : $item['quantity'],
                    'total_price' => $totalPrice,
                ]);
            }

            $invoice->update([
                'subtotal' => $subtotal,
                'total_amount' => $subtotal,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', ['type' => 'success', 'message' => 'Invoice saved successfully.']);
    }
}
