import { Head, Link, router } from '@inertiajs/react';
import {
    SearchIcon,
    XIcon,
    FilterIcon,
    ShieldIcon,
    UsersIcon,
    FileTextIcon,
    ClockIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {BreadcrumbItem} from '@/types';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions_count: number;
    users_count: number;
    created_at: string;
}

interface Summary {
    total_roles: number;
    total_permissions: number;
    total_users: number;
    recent_roles: number;
}

interface Props {
    roles: {
        data: Role[];
        links: any[];
        total: number;
        from: number;
        to: number;
        last_page: number;
    };
    filters: {
        search?: string;
        date_from?: string;
        date_to?: string;
        guard_name?: string;
    };
    summary: Summary;
    guards: string[];
    can: { manage: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Roles', href: '/settings/application-settings/roles' },
];

export default function RolesIndex({ roles, filters, summary, guards, can }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [guardName, setGuardName] = useState(filters.guard_name || 'all');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function applyFilters() {
        router.get(
            '/settings/application-settings/roles',
            {
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                guard_name: guardName === 'all' ? undefined : guardName,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['roles', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setGuardName('all');
        router.get(
            '/settings/application-settings/roles',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['roles', 'filters'],
            },
        );
    }

    function hasActiveFilters() {
        return !!(
            search ||
            dateFrom ||
            dateTo ||
            guardName !== 'all'
        );
    }

    function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/settings/application-settings/roles/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="Roles & Permissions" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Roles & Permissions
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {roles.total > 0
                                ? `Showing ${roles.from}–${roles.to} of ${roles.total} roles`
                                : 'No roles on file'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild className="shrink-0">
                            <Link href="/settings/application-settings/roles/create">
                                <ShieldIcon className="mr-2 h-4 w-4" />
                                New Role
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                <ShieldIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {summary.total_roles}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Total Roles
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                <FileTextIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {summary.total_permissions}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Total Permissions
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-violet-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                <UsersIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {summary.total_users}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Users with Roles
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {summary.recent_roles}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Created This Month
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Bar */}
                <Card>
                    <CardContent className="p-0">
                        <div className="flex items-center gap-2 border-b border-border p-3">
                            <div className="relative flex-1 min-w-0">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search roles by name…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 pr-9"
                                    aria-label="Search roles"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            applyFilters();
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Button
                                variant={filtersOpen ? 'secondary' : 'outline'}
                                size="icon"
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                className="shrink-0"
                                aria-label="Toggle filters"
                                aria-expanded={filtersOpen}
                            >
                                <FilterIcon className="h-4 w-4" />
                            </Button>
                            {hasActiveFilters() && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="shrink-0"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>

                        <div
                            className={`overflow-hidden transition-all duration-200 ${
                                filtersOpen
                                    ? 'max-h-56 opacity-100'
                                    : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="flex flex-wrap items-end gap-3 p-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="date-from"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Created From
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="date-from"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) =>
                                                setDateFrom(e.target.value)
                                            }
                                            className="h-9 w-[160px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="date-to"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Created To
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="date-to"
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) =>
                                                setDateTo(e.target.value)
                                            }
                                            className="h-9 w-[160px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="guard-filter"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Guard
                                    </Label>
                                    <Select
                                        value={guardName}
                                        onValueChange={setGuardName}
                                    >
                                        <SelectTrigger
                                            id="guard-filter"
                                            className="w-[140px] h-9"
                                        >
                                            <SelectValue placeholder="All guards" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All guards
                                            </SelectItem>
                                            {guards.map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {g}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={applyFilters}
                                    className="h-9 shrink-0"
                                >
                                    <SearchIcon className="mr-1.5 h-3.5 w-3.5" />
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active filter badges */}
                {hasActiveFilters() && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Active filters:
                        </span>
                        {search && (
                            <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                            >
                                Search: "{search}"
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        applyFilters();
                                    }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove search filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateFrom && (
                            <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                            >
                                From{' '}
                                {new Date(dateFrom).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                                <button
                                    onClick={() => {
                                        setDateFrom('');
                                        applyFilters();
                                    }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove from date filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateTo && (
                            <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                            >
                                To{' '}
                                {new Date(dateTo).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                                <button
                                    onClick={() => {
                                        setDateTo('');
                                        applyFilters();
                                    }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove to date filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {guardName !== 'all' && (
                            <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                            >
                                Guard: {guardName}
                                <button
                                    onClick={() => {
                                        setGuardName('all');
                                        applyFilters();
                                    }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove guard filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border px-6 py-3">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            All Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {roles.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No roles found</AlertTitle>
                                    <AlertDescription>
                                        {hasActiveFilters()
                                            ? 'No roles match your current filters.'
                                            : 'No roles have been created yet.'}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <Table className="hidden sm:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role Name</TableHead>
                                            <TableHead>Guard</TableHead>
                                            <TableHead>Permissions</TableHead>
                                            <TableHead>Users Assigned</TableHead>
                                            <TableHead>Created</TableHead>
                                            {can.manage && (
                                                <TableHead className="w-24 text-right">
                                                    Actions
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roles.data.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium capitalize">
                                                    {role.name}
                                                    {role.name === 'super admin' && (
                                                        <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-destructive border border-destructive/20 uppercase">
                                                            System
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground uppercase">
                                                    {role.guard_name}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                                        <ShieldIcon className="h-3 w-3" />
                                                        {role.permissions_count} rules
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {role.users_count}{' '}
                                                    {role.users_count === 1 ? 'user' : 'users'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                                    {new Date(role.created_at).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </TableCell>
                                                {can.manage && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button asChild variant="ghost" size="sm">
                                                                <Link href={`/settings/application-settings/roles/${role.id}/edit`}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                                                    <span className="sr-only">Edit</span>
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive disabled:opacity-50"
                                                                onClick={() => setDeleteTarget(role)}
                                                                disabled={role.name === 'super admin' || role.users_count > 0}
                                                                title={
                                                                    role.name === 'super admin'
                                                                        ? 'Cannot delete system role'
                                                                        : role.users_count > 0
                                                                        ? 'Cannot delete role with assigned users'
                                                                        : 'Delete role'
                                                                }
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Mobile card list */}
                                <div className="sm:hidden divide-y divide-border">
                                    {roles.data.map((role) => (
                                        <div
                                            key={role.id}
                                            className="p-4 space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground capitalize truncate flex items-center gap-2">
                                                        {role.name}
                                                        {role.name === 'super admin' && (
                                                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-destructive border border-destructive/20 uppercase">
                                                                System
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground uppercase">
                                                        {role.guard_name}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground shrink-0">
                                                    <ShieldIcon className="h-3 w-3" />
                                                    {role.permissions_count}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Users
                                                    </span>
                                                    <p className="font-medium text-foreground">
                                                        {role.users_count}{' '}
                                                        {role.users_count === 1 ? 'user' : 'users'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Created
                                                    </span>
                                                    <p className="font-medium text-muted-foreground">
                                                        {new Date(role.created_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            {can.manage && (
                                                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Link href={`/settings/application-settings/roles/${role.id}/edit`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive disabled:opacity-50"
                                                        onClick={() => setDeleteTarget(role)}
                                                        disabled={role.name === 'super admin' || role.users_count > 0}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {roles.last_page > 1 && (
                                    <div className="border-t border-border px-6 py-3">
                                        <Pagination links={roles.links} />
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Role"
                description={`Are you sure you want to delete the "${deleteTarget?.name}" role?`}
                confirmLabel="Delete Role"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

RolesIndex.layout = { breadcrumbs };
