<?php

namespace App\Http\Controllers\ApplicationSettings;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApplicationSettings\StoreRoleRequest;
use App\Http\Requests\ApplicationSettings\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('roles.view');

        $search = $request->input('search');

        $roles = Role::withCount('permissions', 'users')
            ->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions_count' => $role->permissions_count,
                'users_count' => $role->users_count,
                'created_at' => $role->created_at,
            ]);

        return Inertia::render('application-settings/roles/index', [
            'roles' => $roles,
            'filters' => $request->only('search'),
            'can' => [
                'manage' => auth()->user()?->can('roles.manage'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        Gate::authorize('roles.manage');

        return Inertia::render('application-settings/roles/create', [
            'allPermissions' => $this->groupedPermissions(),
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $role = Role::create(['name' => $validated['name'], 'guard_name' => 'web']);
        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('application-settings.roles.index')
            ->with('flash', ['type' => 'success', 'message' => 'Role created successfully.']);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        Gate::authorize('roles.manage');

        return Inertia::render('application-settings/roles/edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ],
            'allPermissions' => $this->groupedPermissions(),
        ]);
    }

    /**
     * Update the specified role and sync permissions.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $validated = $request->validated();

        // Prevent renaming the super admin role
        if ($role->name !== 'super admin') {
            $role->update(['name' => $validated['name']]);
        }

        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('application-settings.roles.index')
            ->with('flash', ['type' => 'success', 'message' => 'Role updated successfully.']);
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        Gate::authorize('roles.manage');

        if ($role->name === 'super admin') {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'The Super Admin role cannot be deleted.',
            ]);
        }

        if ($role->users()->count() > 0) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => "Cannot delete role \"{$role->name}\" because it is assigned to {$role->users()->count()} user(s).",
            ]);
        }

        $role->delete();

        return redirect()->route('application-settings.roles.index')
            ->with('flash', ['type' => 'success', 'message' => 'Role deleted successfully.']);
    }

    /**
     * Return all permissions grouped by their module prefix.
     *
     * @return array<string, array<int, string>>
     */
    private function groupedPermissions(): array
    {
        $grouped = [];

        Permission::orderBy('name')->each(function (Permission $permission) use (&$grouped) {
            $parts = explode('.', $permission->name, 2);
            $module = count($parts) > 1 ? $parts[0] : 'general';
            $grouped[$module][] = $permission->name;
        });

        ksort($grouped);

        return $grouped;
    }
}
