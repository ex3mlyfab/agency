<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    /**
     * Display a listing of branches.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('branches.view');

        $query = Branch::query()->withCount('chambers');

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $branches = $query->orderBy('name')->paginate(12)->withQueryString();

        return Inertia::render('branches/index', [
            'branches' => $branches,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
            ],
            'can' => [
                'manage' => auth()->user()?->can('branches.manage'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new branch.
     */
    public function create(): Response
    {
        Gate::authorize('branches.manage');

        return Inertia::render('branches/create');
    }

    /**
     * Store a newly created branch.
     */
    public function store(StoreBranchRequest $request): RedirectResponse
    {
        Branch::create($request->validated());

        return redirect()->route('branches.index')
            ->with('flash', ['type' => 'success', 'message' => 'Branch created successfully.']);
    }

    /**
     * Show the form for editing a branch.
     */
    public function edit(Branch $branch): Response
    {
        Gate::authorize('branches.manage');

        return Inertia::render('branches/edit', [
            'branch' => $branch,
        ]);
    }

    /**
     * Update the specified branch.
     */
    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $branch->update($request->validated());

        return redirect()->route('branches.index')
            ->with('flash', ['type' => 'success', 'message' => 'Branch updated.']);
    }

    /**
     * Remove the specified branch.
     */
    public function destroy(Branch $branch): RedirectResponse
    {
        Gate::authorize('branches.manage');

        if ($branch->chambers()->exists()) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Cannot delete a branch that has chambers. Try marking it as inactive instead.',
            ]);
        }

        $branch->delete();

        return redirect()->route('branches.index')
            ->with('flash', ['type' => 'success', 'message' => 'Branch deleted.']);
    }
}
