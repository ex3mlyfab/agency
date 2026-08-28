<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of the services.
     */
    public function index(): Response
    {
        Gate::authorize('services.view');

        $query = Service::query();

        if (request()->filled('search')) {
            $query->where('name', 'like', '%'.request('search').'%');
        }

        $sort = request('sort', 'name_asc');
        match ($sort) {
            'name_desc' => $query->orderBy('name', 'desc'),
            'newest' => $query->orderBy('created_at', 'desc'),
            'oldest' => $query->orderBy('created_at', 'asc'),
            default => $query->orderBy('name', 'asc'),
        };

        $services = $query->paginate(10)->withQueryString();

        return Inertia::render('services/index', [
            'services' => $services,
            'filters' => [
                'search' => request('search'),
                'sort' => request('sort', 'name_asc'),
            ],
            'can' => [
                'manage' => auth()->user()?->can('services.manage'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new service.
     */
    public function create(): Response
    {
        Gate::authorize('services.manage');

        return Inertia::render('services/create');
    }

    /**
     * Store a newly created service in storage.
     */
    public function store(StoreServiceRequest $request): RedirectResponse
    {
        Service::create($request->validated());

        return redirect()->route('services.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service created successfully.']);
    }

    /**
     * Show the form for editing the specified service.
     */
    public function edit(Service $service): Response
    {
        Gate::authorize('services.manage');

        return Inertia::render('services/edit', [
            'service' => $service,
        ]);
    }

    /**
     * Update the specified service in storage.
     */
    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $service->update($request->validated());

        return redirect()->route('services.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service updated successfully.']);
    }

    /**
     * Remove the specified service from storage.
     */
    public function destroy(Service $service): RedirectResponse
    {
        Gate::authorize('services.manage');

        if ($service->servicePrices()->exists()) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Cannot delete service because it is linked to one or more service prices.',
            ]);
        }

        $service->delete();

        return redirect()->route('services.index')
            ->with('flash', ['type' => 'success', 'message' => 'Service deleted successfully.']);
    }
}
