<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServicePriceRequest;
use App\Http\Requests\UpdateServicePriceRequest;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ServicePriceController extends Controller
{
    /**
     * Display a listing of the service prices.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('service_prices.view');

        $search = $request->input('search');
        $serviceId = $request->input('service_id');
        $serviceCategoryId = $request->input('service_category_id');
        $perPage = $request->input('per_page', 15);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        $servicePrices = ServicePrice::with(['service', 'serviceCategory'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('service', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    })->orWhereHas('serviceCategory', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    })->orWhere('source', 'like', "%{$search}%");
                });
            })
            ->when($serviceId && $serviceId !== 'all', function ($query) use ($serviceId) {
                $query->where('service_id', $serviceId);
            })
            ->when($serviceCategoryId && $serviceCategoryId !== 'all', function ($query) use ($serviceCategoryId) {
                $query->where('service_category_id', $serviceCategoryId);
            })
            ->when($sortBy === 'service', function ($query) use ($sortDir) {
                $query->join('services', 'service_prices.service_id', '=', 'services.id')
                    ->orderBy('services.name', $sortDir)
                    ->select('service_prices.*');
            })
            ->when($sortBy === 'category', function ($query) use ($sortDir) {
                $query->join('service_categories', 'service_prices.service_category_id', '=', 'service_categories.id')
                    ->orderBy('service_categories.name', $sortDir)
                    ->select('service_prices.*');
            })
            ->when($sortBy === 'price', function ($query) use ($sortDir) {
                $query->orderBy('price', $sortDir);
            })
            ->when(! in_array($sortBy, ['service', 'category', 'price']), function ($query) use ($sortBy, $sortDir) {
                $query->orderBy($sortBy, $sortDir);
            })
            ->paginate((int) $perPage)
            ->withQueryString();

        return Inertia::render('service-prices/index', [
            'servicePrices' => $servicePrices,
            'services' => Service::orderBy('name')->get(['id', 'name']),
            'serviceCategories' => ServiceCategory::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'service_id', 'service_category_id', 'per_page', 'sort_by', 'sort_dir']),
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
