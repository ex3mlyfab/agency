import { Head, useForm } from '@inertiajs/react';
import { Shield, SearchIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { InputError } from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {BreadcrumbItem} from '@/types';

interface Role {
    id: number | string;
    name: string;
    permissions: string[];
}

interface Props {
    role: Role;
    allPermissions: Record<string, string[]>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Roles', href: '/settings/application-settings/roles' },
    { title: 'Edit Role', href: '/settings/application-settings/roles/edit' },
];

export default function RoleEdit({ role, allPermissions }: Props) {
    const isSuperAdmin = role.name === 'super admin';

    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        permissions: string[];
    }>({
        name: role.name,
        permissions: role.permissions,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.keys(allPermissions).forEach((key) => {
            initial[key] = true;
        });

        return initial;
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/settings/application-settings/roles/${role.id}`);
    }

    function togglePermission(permission: string) {
        if (data.permissions.includes(permission)) {
            setData('permissions', data.permissions.filter((p) => p !== permission));
        } else {
            setData('permissions', [...data.permissions, permission]);
        }
    }

    function toggleModule(modulePermissions: string[]) {
        const allSelected = modulePermissions.every((p) => data.permissions.includes(p));

        if (allSelected) {
            setData('permissions', data.permissions.filter((p) => !modulePermissions.includes(p)));
        } else {
            const toAdd = modulePermissions.filter((p) => !data.permissions.includes(p));
            setData('permissions', [...data.permissions, ...toAdd]);
        }
    }

    function removePermission(permission: string) {
        setData('permissions', data.permissions.filter((p) => p !== permission));
    }

    const filteredModules = Object.entries(allPermissions).map(([module, permissions]) => {
        if (!searchQuery.trim()) {
return [module, permissions] as const;
}

        const filtered = permissions.filter((p) =>
            p.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return filtered.length > 0 ? ([module, filtered] as const) : null;
    }).filter(Boolean) as [string, string[]][];

    return (
        <>
            <Head title="Edit Role" />
            <div className="space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        Edit Role: <span className="capitalize">{role.name}</span>
                        {isSuperAdmin && (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold tracking-wider text-destructive border border-destructive/20 uppercase">
                                System Role
                            </span>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Modify the role's name and manage its permissions.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-border px-6 py-3">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Role Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 px-6 py-6">
                            <div className="space-y-1.5 max-w-xl">
                                <Label htmlFor="name" className="font-semibold">
                                    Role Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Manager, Receptionist"
                                    disabled={processing || isSuperAdmin}
                                    className={isSuperAdmin ? 'bg-muted' : ''}
                                />
                                {isSuperAdmin && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        The name of this system role cannot be changed.
                                    </p>
                                )}
                                <InputError message={errors.name} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border px-6 py-4 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Permissions Assignment
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Select the capabilities users with this role will have.
                                </CardDescription>
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                                {data.permissions.length} selected
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-6">
                            <InputError message={errors.permissions} className="mb-4" />

                            {data.permissions.length > 0 && (
                                <div className="mb-4 flex flex-wrap gap-1.5">
                                    {data.permissions.map((permission) => (
                                        <Badge
                                            key={permission}
                                            variant="secondary"
                                            className="text-xs px-2 py-0.5 gap-1"
                                        >
                                            {permission.split('.')[1] || permission}
                                            <button
                                                type="button"
                                                onClick={() => removePermission(permission)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="relative mb-4">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search permissions…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {filteredModules.map(([module, permissions]) => {
                                    const allSelected = permissions.every((p) => data.permissions.includes(p));
                                    const someSelected = permissions.some((p) => data.permissions.includes(p)) && !allSelected;

                                    return (
                                        <div key={module} className="rounded-lg border border-border overflow-hidden">
                                            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
                                                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold capitalize flex-1 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={(input) => {
                                                            if (input) {
                                                                input.indeterminate = someSelected;
                                                            }
                                                        }}
                                                        onChange={() => toggleModule(permissions)}
                                                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                                                        disabled={processing}
                                                    />
                                                    <span className="truncate">{module.replace('_', ' ')}</span>
                                                </label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => setOpenModules((prev) => ({ ...prev, [module]: !prev[module] }))}
                                                >
                                                    {openModules[module] ? 'Collapse' : 'Expand'}
                                                </Button>
                                            </div>
                                            {openModules[module] && (
                                                <div className="divide-y divide-border">
                                                    {permissions.map((permission) => (
                                                        <label
                                                            key={permission}
                                                            className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-secondary/50 px-4 py-2 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={data.permissions.includes(permission)}
                                                                onChange={() => togglePermission(permission)}
                                                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                                                disabled={processing}
                                                            />
                                                            <span className="text-muted-foreground">
                                                                {permission.split('.')[1] || permission}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredModules.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No permissions match your search.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

RoleEdit.layout = { breadcrumbs };
