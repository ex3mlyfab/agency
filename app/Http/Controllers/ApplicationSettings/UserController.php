<?php

namespace App\Http\Controllers\ApplicationSettings;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApplicationSettings\StoreUserRequest;
use App\Http\Requests\ApplicationSettings\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('users.view');

        $search = $request->input('search');
        $role = $request->input('role');
        $verified = $request->input('verified');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $users = User::with('roles')
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role, function ($query, $role) {
                $query->whereHas('roles', fn ($query) => $query->where('name', $role));
            })
            ->when($verified === 'verified', fn ($query) => $query->whereNotNull('email_verified_at'))
            ->when($verified === 'unverified', fn ($query) => $query->whereNull('email_verified_at'))
            ->when($dateFrom, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($dateTo, fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
            ]);

        $stats = [
            'total' => User::count(),
            'super_admins' => User::whereHas('roles', fn ($query) => $query->where('name', 'super admin'))->count(),
            'verified' => User::whereNotNull('email_verified_at')->count(),
            'unverified' => User::whereNull('email_verified_at')->count(),
            'new_this_month' => User::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        return Inertia::render('application-settings/users/index', [
            'users' => $users,
            'roles' => Role::orderBy('name')->get(['id', 'name']),
            'stats' => $stats,
            'filters' => $request->only(['search', 'role', 'verified', 'date_from', 'date_to']),
            'can' => [
                'manage' => auth()->user()?->can('users.manage'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        Gate::authorize('users.manage');

        return Inertia::render('application-settings/users/create', [
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->syncRoles([$validated['role']]);

        return redirect()->route('application-settings.users.index')
            ->with('flash', ['type' => 'success', 'message' => 'User created successfully.']);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        Gate::authorize('users.manage');

        return Inertia::render('application-settings/users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (! empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        $user->syncRoles([$validated['role']]);

        return redirect()->route('application-settings.users.index')
            ->with('flash', ['type' => 'success', 'message' => 'User updated successfully.']);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('users.manage');

        if ($request->user()->id === $user->id) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'You cannot delete your own account.',
            ]);
        }

        $user->delete();

        return redirect()->route('application-settings.users.index')
            ->with('flash', ['type' => 'success', 'message' => 'User deleted successfully.']);
    }
}
