<?php

namespace App\Http\Controllers;

use App\Actions\BuildServiceInvoiceItems;
use App\Actions\CreateStorageFeeInvoice;
use App\Actions\IssueRefund;
use App\Enums\BranchStatus;
use App\Enums\DeceasedStatus;
use App\Http\Requests\StoreDeceasedRequest;
use App\Http\Requests\UpdateDeceasedRequest;
use App\Models\ApplicationSetting;
use App\Models\Branch;
use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMode;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\Transfer;
use App\Support\DocumentNumber;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DeceasedController extends Controller
{
    /**
     * Display a listing of deceased records.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('deceased.view');

        $query = Deceased::with('chamber')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('body_tag_number', 'like', "%{$search}%")
                    ->orWhere('relative_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('service_category_id')) {
            $query->where('service_category_id', $request->service_category_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date_of_death', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date_of_death', '<=', $request->date_to);
        }

        $deceased = $query->paginate(15)->withQueryString();

        $stats = [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', DeceasedStatus::Pending)->count(),
            'in_chamber' => (clone $query)->where('status', DeceasedStatus::InChamber)->count(),
            'released' => (clone $query)->where('status', DeceasedStatus::Released)->count(),
            'avg_days_in_storage' => 0,
        ];

        $serviceCategories = ServiceCategory::orderBy('name')->select(['id', 'name'])->get();
        $genders = ['Male', 'Female', 'Other'];

        return Inertia::render('deceased/index', [
            'deceased' => $deceased,
            'stats' => $stats,
            'serviceCategories' => $serviceCategories->toArray(),
            'genders' => $genders,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'service_category_id' => $request->service_category_id ?? '',
                'date_from' => $request->date_from ?? '',
                'date_to' => $request->date_to ?? '',
            ],
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

        $chambers = Chamber::with('branch:id,name')
            ->whereHas('branch', fn ($query) => $query->where('status', BranchStatus::Active))
            ->orderBy('name')
            ->select(['id', 'name', 'branch_id', 'capacity'])
            ->get()
            ->filter(function (Chamber $chamber) {
                return $chamber->occupants()->count() < $chamber->capacity;
            })
            ->map(function (Chamber $chamber) {
                return [
                    'id' => $chamber->id,
                    'name' => $chamber->name,
                    'branch_id' => $chamber->branch_id,
                    'branch' => $chamber->branch?->name,
                    'available_spaces' => $chamber->capacity - $chamber->occupants()->count(),
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('deceased/create', [
            'chambers' => $chambers,
            'branches' => Branch::query()
                ->where('status', BranchStatus::Active)
                ->orderBy('name')
                ->get(['id', 'name']),
            'serviceCategories' => ServiceCategory::orderBy('name')->get(['id', 'name'])->toArray(),
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

        $deceased = DB::transaction(function () use ($data, $storedAt): Deceased {
            if (! empty($data['chamber_id'])) {
                $chamber = Chamber::query()->lockForUpdate()->findOrFail((string) $data['chamber_id']);

                if ($chamber->occupants()->count() >= $chamber->capacity) {
                    throw ValidationException::withMessages(['chamber_id' => 'The selected chamber is at capacity.']);
                }

                $data['status'] = DeceasedStatus::InChamber;
            }

            $deceased = Deceased::create($data);

            if (! empty($data['chamber_id'])) {
                Transfer::create([
                    'deceased_id' => $deceased->id,
                    'to_chamber_id' => $data['chamber_id'],
                    'transferred_by' => auth()->id() ?? '000000000000000000000000',
                    'event_type' => 'Entered',
                    'transferred_at' => $storedAt ?? now(),
                ]);
            }

            return $deceased;
        });

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
            'invoices.invoiceItems.service',
            // `payments` (not just `receivedByUser`) is eager-loaded so the
            // ledger accessors can read invoice-attached payments without
            // re-querying; the invoice + storageFeeLog nest supports the
            // admission-scoped total_paid filter.
            'payments.invoice.storageFeeLog',
            'payments.receivedByUser',
            'payments.paymentMode',
            'storageFeeLogs.invoice.invoiceItems',
        ]);

        $lastStorageCoveredDay = (int) $deceased->storageFeeLogs->max('days_covered_to');

        $storageServiceId = $deceased->chamber?->service_id;

        $availableServices = ServicePrice::with('servicePriceTiers')
            ->where('service_category_id', $deceased->service_category_id)
            ->where(function ($query) use ($deceased) {
                $query->whereNull('source')
                    ->orWhere('source', $deceased->source);
            })
            // Storage fees are billed exclusively by the storage invoice engine,
            // so the chamber's storage service is not offered as a manual line item.
            ->when($storageServiceId, fn ($query) => $query->where('service_id', '!=', $storageServiceId))
            ->get()
            ->map(function ($sp) use ($deceased) {
                $hasTiers = $sp->servicePriceTiers->isNotEmpty();
                $tieredPrice = $hasTiers ? $sp->calculateStorageCharge($deceased->days_in_storage) : null;

                return [
                    'service_id' => $sp->service_id,
                    'name' => $sp->service->name ?? 'Unknown Service',
                    'price' => (float) $sp->price,
                    'tiered_price' => $tieredPrice !== null ? round($tieredPrice, 2) : null,
                    'has_tiers' => $hasTiers,
                ];
            });

        $paymentModes = PaymentMode::where('is_active', true)->orderBy('name')->get();

        $walletDeposits = Payment::query()
            ->where('deceased_id', $deceased->id)
            ->whereNull('invoice_id')
            ->with('paymentMode')
            ->latest()
            ->get();

        // Pass the current admission's storage fee logs (tagged via
        // admission_started_at) so the frontend ledger can scope storage lines
        // to this stay rather than summing the record's whole history.
        $currentAdmissionStorageLogs = $deceased->storageFeeLogsForCurrentAdmission();

        return Inertia::render('deceased/show', [
            'deceased' => $deceased,
            'availableServices' => $availableServices,
            'storageServiceId' => $storageServiceId,
            'lastStorageCoveredDay' => $lastStorageCoveredDay,
            'currentAdmissionStorageLogs' => $currentAdmissionStorageLogs,
            'paymentModes' => $paymentModes,
            'walletDeposits' => $walletDeposits,
            'walletBalance' => (float) $walletDeposits->sum('amount'),
            'can' => [
                'edit' => auth()->user()?->can('deceased.edit'),
                'delete' => auth()->user()?->can('deceased.delete'),
                'transfer' => auth()->user()?->can('transfers.create'),
                'managePayments' => auth()->user()?->can('payments.manage'),
                'manageWaivers' => auth()->user()?->can('waivers.manage'),
                'createStorageInvoice' => auth()->user()?->can('storage.invoices.manage'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified deceased record.
     */
    public function edit(Deceased $deceased): Response
    {
        Gate::authorize('deceased.edit');

        $chambers = Chamber::with('branch:id,name')
            ->orderBy('name')
            ->select(['id', 'name', 'branch_id', 'capacity'])
            ->get()
            ->filter(function (Chamber $chamber) use ($deceased) {
                if ($chamber->id === $deceased->chamber_id) {
                    return true;
                }

                return $chamber->occupants()->count() < $chamber->capacity
                    && $chamber->branch !== null
                    && $chamber->branch->status === BranchStatus::Active;
            })
            ->map(function (Chamber $chamber) use ($deceased) {
                return [
                    'id' => $chamber->id,
                    'name' => $chamber->name,
                    'branch_id' => $chamber->branch_id,
                    'branch' => $chamber->branch?->name,
                    'available_spaces' => $chamber->capacity - $chamber->occupants()->count(),
                    'is_current' => $chamber->id === $deceased->chamber_id,
                ];
            })
            ->values()
            ->toArray();

        $branches = Branch::query()
            ->orderBy('name')
            ->get(['id', 'name', 'status'])
            ->filter(function (Branch $branch) use ($chambers) {
                // Keep every operational branch, plus the branch of the
                // deceased's current chamber so the select can display it.
                if ($branch->status === BranchStatus::Active) {
                    return true;
                }

                return in_array($branch->id, array_column($chambers, 'branch_id'));
            })
            ->values();

        return Inertia::render('deceased/edit', [
            'deceased' => $deceased,
            'chambers' => $chambers,
            'branches' => $branches,
            'serviceCategories' => ServiceCategory::orderBy('name')->get(['id', 'name'])->toArray(),
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
            $newChamberId = $data['chamber_id'];

            if ($newChamberId) {
                // Entry/transfer: enforce capacity before any write.
                $destination = Chamber::query()->lockForUpdate()->findOrFail((string) $newChamberId);

                if ($destination->occupants()->count() >= $destination->capacity) {
                    throw ValidationException::withMessages(['chamber_id' => 'The selected chamber is at capacity.']);
                }
            }

            if (empty($newChamberId) && $deceased->chamber_id) {
                // Releasing via edit - enforce storage payment check (lifetime)
                if (! $deceased->canReleaseStorage()) {
                    $message = $deceased->isStorageFullyPaid()
                        ? 'Cannot release: an outstanding storage balance of '.number_format($deceased->lifetimeStorageOutstanding(), 2).' remains across prior admissions.'
                        : 'Cannot release: storage days ('.$deceased->days_in_storage.' days) are not fully paid. Only '.$deceased->days_paid.' days paid for the current admission.';

                    return redirect()->back()
                        ->with('flash', [
                            'type' => 'error',
                            'message' => $message,
                        ])
                        ->withErrors(['chamber_id' => 'Storage must be fully paid before release.']);
                }
            }
        }

        DB::transaction(function () use ($data, $storedAt, $deceased): void {
            if (array_key_exists('chamber_id', $data) && $data['chamber_id'] !== $deceased->chamber_id) {
                $oldChamberId = $deceased->chamber_id;
                $newChamberId = $data['chamber_id'];

                if ($newChamberId) {
                    $data['status'] = DeceasedStatus::InChamber;
                    Transfer::create([
                        'deceased_id' => $deceased->id,
                        'from_chamber_id' => $oldChamberId,
                        'to_chamber_id' => $newChamberId,
                        'transferred_by' => (string) (auth()->id() ?? '000000000000000000000000'),
                        'event_type' => $oldChamberId ? 'Transferred' : 'Entered',
                        'transferred_at' => $storedAt ?? now(),
                    ]);
                } elseif ($oldChamberId) {
                    $data['status'] = DeceasedStatus::Released;
                    $data['released_at'] = now();
                    $data['released_by'] = (string) (auth()->id() ?? '000000000000000000000000');
                    Transfer::create([
                        'deceased_id' => $deceased->id,
                        'from_chamber_id' => $oldChamberId,
                        'to_chamber_id' => null,
                        'transferred_by' => (string) (auth()->id() ?? '000000000000000000000000'),
                        'event_type' => DeceasedStatus::Released,
                        'transferred_at' => $storedAt ?? now(),
                    ]);

                    // Book a refund for any storage surplus on the release.
                    $surplus = $deceased->lifetimeStorageSurplus();
                    if ($surplus > 0) {
                        app(IssueRefund::class)->handle(
                            $deceased->id,
                            $surplus,
                            (string) auth()->id(),
                            'Storage refund issued on release (via edit).',
                        );
                    }
                }
            }

            $deceased->update($data);
        });

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

        if ($deceased->status === DeceasedStatus::Released) {
            return redirect()->route('deceased.show', $deceased)
                ->with('flash', ['type' => 'error', 'message' => 'Deceased has already been released.']);
        }

        $deceased->load(['chamber', 'invoices.invoiceItems.service']);

        return Inertia::render('deceased/release', [
            'deceased' => $deceased,
            'billing' => [
                'total_billed' => $deceased->total_billed,
                'total_paid' => $deceased->total_paid,
                'ledger_balance' => $deceased->ledger_balance,
                'is_settled' => $deceased->isBillSettled(),
                'storage_days' => $deceased->days_in_storage,
                'storage_days_paid' => $deceased->days_paid,
                'storage_fully_paid' => $deceased->isStorageFullyPaid(),
                'storage_surplus' => $deceased->lifetimeStorageSurplus(),
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

        if ($deceased->status === DeceasedStatus::Released) {
            return redirect()->route('deceased.show', $deceased)
                ->with('flash', ['type' => 'error', 'message' => 'Deceased has already been released.']);
        }

        // Validate billing status - no admission may leave storage debt unpaid.
        // The gate is lifetime; the days message is admission-aware.
        $unpaidDays = ! $deceased->isStorageFullyPaid();
        $openBalance = $deceased->lifetimeStorageOutstanding() > 0;

        if (($unpaidDays || $openBalance) && ! $request->boolean('bypass_billing_restriction')) {
            $message = $unpaidDays
                ? 'Cannot release: storage days ('.$deceased->days_in_storage.' days) are not fully paid. Only '.$deceased->days_paid.' days paid for the current admission.'
                : 'Cannot release: an outstanding storage balance of '.number_format($deceased->lifetimeStorageOutstanding(), 2).' remains across prior admissions.';

            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => $message,
                ])
                ->withErrors(['billing' => 'Storage must be fully settled before release.']);
        }

        if (($unpaidDays || $openBalance) && $request->boolean('bypass_billing_restriction')) {
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
                'transferred_by' => auth()->id() ?? '000000000000000000000000',
                'event_type' => 'Released',
                'notes' => $validated['release_notes'] ?? ('Released to '.$validated['released_to_name'].' ('.$validated['released_to_relationship'].')'),
                'transferred_at' => now(),
            ]);

            // Book a refund for any storage surplus (money overpaid/waived
            // beyond what was actually billed). The refund is a negative
            // invoice + negative general receipt so the ledger nets to zero.
            $surplus = $deceased->lifetimeStorageSurplus();
            if ($surplus > 0) {
                app(IssueRefund::class)->handle(
                    $deceased->id,
                    $surplus,
                    (string) auth()->id(),
                    'Storage refund issued on release for '.$validated['released_to_name'].' ('.$validated['released_to_relationship'].')',
                );
            }
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

        if ($deceased->status === 'Released') {
            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Cannot edit invoice: this deceased record has been released.',
                ]);
        }

        // Storage fees are billed exclusively by the storage invoice engine.
        $storageServiceId = $deceased->chamber?->service_id;

        // Block editing if any service invoice OR any storage invoice is paid or partially paid
        $blockedInvoices = collect()
            ->merge($deceased->invoices)
            ->merge($deceased->storageFeeLogs->pluck('invoice'))
            ->filter(fn ($inv) => $inv !== null)
            ->filter(fn ($inv) => in_array($inv->status, ['Paid', 'Partially Paid'], true));

        if ($blockedInvoices->isNotEmpty()) {
            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Cannot edit invoice: one or more invoices for this record are already paid or partially paid.',
                ]);
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'exists:services,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // Reject the chamber's storage service: storage fees are billed by the
        // dedicated storage invoice engine, never by a manual service invoice.
        if ($storageServiceId !== null && collect((array) $validated['items'])->contains('service_id', $storageServiceId)) {
            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Storage fees are billed by the storage invoice, not a service invoice. Use "Generate Storage Invoice" instead.',
                ]);
        }

        DB::transaction(function () use ($validated, $deceased) {
            $invoice = $deceased->invoices->where('status', 'Unpaid')->first();
            if (! $invoice) {
                $invoice = Invoice::create([
                    'deceased_id' => $deceased->id,
                    'invoice_number' => DocumentNumber::invoice($deceased->chamber?->branch?->slug),
                    'subtotal' => 0.00,
                    'discount' => 0.00,
                    'tax' => 0.00,
                    'total_amount' => 0.00,
                    'paid_amount' => 0.00,
                    'status' => 'Unpaid',
                    'billing_type' => 'service',
                    'created_by' => auth()->id() ?? '000000000000000000000000',
                ]);
            }

            $invoice->invoiceItems()->delete();

            $subtotal = (new BuildServiceInvoiceItems)->handle(
                $invoice,
                $deceased,
                $validated['items'],
                $validated['notes'] ?? null
            );
        });

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', ['type' => 'success', 'message' => 'Invoice saved successfully.']);
    }

    /**
     * Generate a new service invoice for the deceased person.
     */
    public function generateInvoice(Request $request, Deceased $deceased): RedirectResponse
    {
        Gate::authorize('deceased.edit');

        if ($deceased->status === 'Released') {
            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Cannot create invoice: this deceased record has been released.',
                ]);
        }

        // Storage fees are billed exclusively by the storage invoice engine.
        $storageServiceId = $deceased->chamber?->service_id;

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'exists:services,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // Reject the chamber's storage service: storage fees are billed by the
        // dedicated storage invoice engine, never by a manual service invoice.
        if ($storageServiceId !== null && collect((array) $validated['items'])->contains('service_id', $storageServiceId)) {
            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Storage fees are billed by the storage invoice, not a service invoice. Use "Generate Storage Invoice" instead.',
                ]);
        }

        DB::transaction(function () use ($validated, $deceased) {
            $invoice = Invoice::create([
                'deceased_id' => $deceased->id,
                'invoice_number' => DocumentNumber::invoice($deceased->chamber?->branch?->slug),
                'subtotal' => 0.00,
                'discount' => 0.00,
                'tax' => 0.00,
                'total_amount' => 0.00,
                'paid_amount' => 0.00,
                'status' => 'Unpaid',
                'billing_type' => 'service',
                'created_by' => auth()->id() ?? '000000000000000000000000',
            ]);

            $subtotal = (new BuildServiceInvoiceItems)->handle(
                $invoice,
                $deceased,
                $validated['items'],
                $validated['notes'] ?? null
            );
        });

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', ['type' => 'success', 'message' => 'Service invoice generated successfully.']);
    }

    /**
     * Generate the initial storage fee invoice for all days spent in storage.
     */
    public function generateStorageInvoice(CreateStorageFeeInvoice $action, Deceased $deceased): RedirectResponse
    {
        Gate::authorize('deceased.edit');

        if ($deceased->status !== 'InChamber') {
            return redirect()->back()
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Storage invoices can only be created while the deceased is in a chamber.',
                ]);
        }

        $lastCoveredDay = (int) $deceased->storageFeeLogs->max('days_covered_to');
        $invoice = $action->handle($deceased, (string) (auth()->id() ?? '000000000000000000000000'), $lastCoveredDay);

        if ($invoice) {
            return redirect()->route('deceased.show', $deceased)
                ->with('flash', ['type' => 'success', 'message' => "Storage fee invoice {$invoice->invoice_number} created for ".($invoice->invoiceItems->first()->quantity ?? 0).' day(s).']);
        }

        return redirect()->route('deceased.show', $deceased)
            ->with('flash', ['type' => 'info', 'message' => 'No storage days need billing at this time.']);
    }

    /**
     * Render a print-optimized view of the deceased record with invoice and payment data.
     */
    public function print(Deceased $deceased): View|Factory
    {
        Gate::authorize('deceased.view');

        $deceased->load([
            'invoices.invoiceItems.service',
            'invoices.createdByUser',
            'payments.receivedByUser',
            'storageFeeLogs.invoice',
        ]);

        $serviceInvoices = $deceased->invoices;
        $storageLogs = $deceased->storageFeeLogs;
        $payments = $deceased->payments;

        $serviceInvoicesTotal = $serviceInvoices->sum('total_amount');
        $storageInvoicesTotal = $storageLogs->sum(fn ($log) => $log->invoice ? (float) $log->invoice->total_amount : 0.0);
        $totalBilled = $serviceInvoicesTotal + $storageInvoicesTotal;
        $totalPaid = $payments->sum('amount');
        $totalWaived = $serviceInvoices->sum('waived_amount') + $storageLogs->sum(fn ($log) => $log->invoice ? (float) $log->invoice->waived_amount : 0.0);
        $ledgerBalance = $totalBilled - $totalPaid - $totalWaived;

        $currencySymbol = ApplicationSetting::get('currency_symbol', '₦');
        $branding = [
            'name' => ApplicationSetting::get('app_name', config('app.name')),
            'logo' => ApplicationSetting::get('app_logo')
                ? Storage::disk('public')->url(ApplicationSetting::get('app_logo'))
                : null,
            'currency_symbol' => $currencySymbol,
        ];

        return view('deceased-print', compact(
            'deceased',
            'serviceInvoices',
            'storageLogs',
            'payments',
            'totalBilled',
            'totalPaid',
            'totalWaived',
            'ledgerBalance',
            'currencySymbol',
            'branding',
        ));
    }
}
