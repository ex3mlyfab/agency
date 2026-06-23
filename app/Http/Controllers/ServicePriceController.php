<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServicePriceRequest;
use App\Http\Requests\UpdateServicePriceRequest;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ServicePriceController extends Controller
{
    /**
     * Display a listing of the service prices.
     */
    public function index(): Response
    {
        Gate::authorize('service_prices.view');

        $servicePrices = ServicePrice::with(['service', 'serviceCategory'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('service-prices/index', [
            'servicePrices' => $servicePrices,
            'can' => [
                'manage' => auth()->user()?->can('service_prices.manage'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new service price.
     */
    public function create(): Response
    {
        Gate::authorize('service_prices.manage');

        return Inertia::render('service-prices/create', [
            'services' => Service::orderBy('name')->get(['id', 'name']),
            'serviceCategories' => ServiceCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created service price in storage.
     */
    public function store(StoreServicePriceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            $servicePrice = ServicePrice::create([
                'service_id' => $validated['service_id'],
                'service_category_id' => $validated['service_category_id'],
                'price' => $validated['price'],
                'source' => $validated['source'] ?? null,
            ]);

            if (! empty($validated['tiers'])) {
                foreach ($validated['tiers'] as $tier) {
                    $servicePrice->servicePriceTiers()->create($tier);
                }
            }
        });

        return redirect()->route('service-prices.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service price created successfully.']);
    }

    /**
     * Show the form for editing the specified service price.
     */
    public function edit(ServicePrice $servicePrice): Response
    {
        Gate::authorize('service_prices.manage');

        $servicePrice->load('servicePriceTiers');

        return Inertia::render('service-prices/edit', [
            'servicePrice' => $servicePrice,
            'services' => Service::orderBy('name')->get(['id', 'name']),
            'serviceCategories' => ServiceCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified service price in storage.
     */
    public function update(UpdateServicePriceRequest $request, ServicePrice $servicePrice): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $servicePrice) {
            $servicePrice->update([
                'service_id' => $validated['service_id'],
                'service_category_id' => $validated['service_category_id'],
                'price' => $validated['price'],
                'source' => $validated['source'] ?? null,
            ]);

            $servicePrice->servicePriceTiers()->delete();

            if (! empty($validated['tiers'])) {
                foreach ($validated['tiers'] as $tier) {
                    $servicePrice->servicePriceTiers()->create($tier);
                }
            }
        });

        return redirect()->route('service-prices.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service price updated successfully.']);
    }

    /**
     * Remove the specified service price from storage.
     */
    public function destroy(ServicePrice $servicePrice): RedirectResponse
    {
        Gate::authorize('service_prices.manage');

        $servicePrice->delete();

        return redirect()->route('service-prices.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service price deleted successfully.']);
    }
}
