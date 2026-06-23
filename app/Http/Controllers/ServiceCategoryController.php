<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceCategoryRequest;
use App\Http\Requests\UpdateServiceCategoryRequest;
use App\Models\ServiceCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ServiceCategoryController extends Controller
{
    /**
     * Display a listing of the service categories.
     */
    public function index(): Response
    {
        Gate::authorize('service_categories.view');

        $serviceCategories = ServiceCategory::latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('service-categories/index', [
            'serviceCategories' => $serviceCategories,
            'can' => [
                'manage' => auth()->user()?->can('service_categories.manage'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new service category.
     */
    public function create(): Response
    {
        Gate::authorize('service_categories.manage');

        return Inertia::render('service-categories/create');
    }

    /**
     * Store a newly created service category.
     */
    public function store(StoreServiceCategoryRequest $request): RedirectResponse
    {
        ServiceCategory::create($request->validated());

        return redirect()->route('service-categories.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service category created successfully.']);
    }

    /**
     * Show the form for editing the specified service category.
     */
    public function edit(ServiceCategory $serviceCategory): Response
    {
        Gate::authorize('service_categories.manage');

        return Inertia::render('service-categories/edit', [
            'serviceCategory' => $serviceCategory,
        ]);
    }

    /**
     * Update the specified service category.
     */
    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $serviceCategory): RedirectResponse
    {
        $serviceCategory->update($request->validated());

        return redirect()->route('service-categories.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service category updated successfully.']);
    }

    /**
     * Remove the specified service category.
     */
    public function destroy(ServiceCategory $serviceCategory): RedirectResponse
    {
        Gate::authorize('service_categories.manage');

        if ($serviceCategory->servicePrices()->exists()) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Cannot delete service category because it is linked to one or more service prices.',
            ]);
        }

        $serviceCategory->delete();

        return redirect()->route('service-categories.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service category deleted successfully.']);
    }
}
