import { Head, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    SearchIcon,
    XIcon,
    FilterIcon,
    CalendarIcon,
    UsersIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ClockIcon,
    UserPlusIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { PaginationLink } from '@/components/pagination';
import { Pagination } from '@/components/pagination';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import type { BreadcrumbItem } from '@/types';

interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    email_verified_at: string | null;
    created_at: string;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: PaginationLink[];
}

interface RoleOption {
    id: number;
    name: string;
}

interface Stats {
    total: number;
    super_admins: number;
    verified: number;
    unverified: number;
    new_this_month: number;
}

interface Props {
    users: PaginatedUsers;
    roles: RoleOption[];
    stats: Stats;
    filters: {
        search: string;
        role: string;
        verified: string;
        date_from: string;
        date_to: string;
    };
    can: { manage: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Users', href: '/settings/application-settings/users' },
];

function formatDate(date: string): string {
    if (!date) {
        return '—';
    }

    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function UsersIndex({ users, roles, stats, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? 'all');
    const [verified, setVerified] = useState(filters.verified ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    function applyFilters() {
        router.get(
            '/settings/application-settings/users',
            {
                search: search || undefined,
                role: role === 'all' ? undefined : role,
                verified: verified === 'all' ? undefined : verified,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['users', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setRole('all');
        setVerified('all');
        setDateFrom('');
        setDateTo('');
        router.get('/settings/application-settings/users', {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'filters'],
        });
    }

    function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/settings/application-settings/users/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    function hasActiveFilters() {
        return !!(
            search ||
            role !== 'all' ||
            verified !== 'all' ||
            dateFrom ||
            dateTo
        );
    }

    const total = stats.total ?? 0;
    const superAdmins = stats.super_admins ?? 0;
    const verifiedCount = stats.verified ?? 0;
    const unverifiedCount = stats.unverified ?? 0;
    const newThisMonth = stats.new_this_month ?? 0;

    return (
        <>
            <Head title="User Management" />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            User Management
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {total > 0
                                ? `Showing ${users.from}–${users.to} of ${users.total} users`
                                : 'No users on file'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild className="shrink-0">
                            <Link href="/settings/application-settings/users/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                New User
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                <UsersIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {total}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Total Users
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-violet-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                <ShieldCheckIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {superAdmins}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Super Admins
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {verifiedCount}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Verified
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
                                    {unverifiedCount}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Unverified
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-2 overflow-hidden lg:col-span-1">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-500/10">
                                <UserPlusIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {newThisMonth}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    New This Month
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Bar */}
                <Card>
                    <CardContent className="p-0">
                        {/* Top row: search + toggle */}
                        <div className="flex items-center gap-2 border-b border-border p-3">
                            <div className="relative flex-1 min-w-0">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by name or email…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 pr-9"
                                    aria-label="Search users"
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
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Collapsible filter row */}
                        <div
                            className={`overflow-hidden transition-all duration-200 ${
                                filtersOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="flex flex-wrap items-end gap-3 p-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="role-filter" className="text-xs font-medium text-muted-foreground">
                                        Role
                                    </Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger id="role-filter" className="w-[160px]">
                                            <SelectValue placeholder="All roles" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All roles</SelectItem>
                                            {roles.map((option) => (
                                                <SelectItem key={option.id} value={option.name}>
                                                    {option.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="verified-filter" className="text-xs font-medium text-muted-foreground">
                                        Email Status
                                    </Label>
                                    <Select value={verified} onValueChange={setVerified}>
                                        <SelectTrigger id="verified-filter" className="w-[150px]">
                                            <SelectValue placeholder="Any status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any status</SelectItem>
                                            <SelectItem value="verified">Verified</SelectItem>
                                            <SelectItem value="unverified">Unverified</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="date-from" className="text-xs font-medium text-muted-foreground">
                                        Created From
                                    </Label>
                                    <div className="relative">
                                        <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="date-from"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="pl-8 h-9"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="date-to" className="text-xs font-medium text-muted-foreground">
                                        Created To
                                    </Label>
                                    <div className="relative">
                                        <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="date-to"
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="pl-8 h-9"
                                        />
                                    </div>
                                </div>

                                <Button variant="default" size="sm" onClick={applyFilters} className="h-9 shrink-0">
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
                        <span className="text-xs text-muted-foreground">Active filters:</span>
                        {search && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                Search: "{search}"
                                <button onClick={() => {
                                    setSearch('');
                                    applyFilters();
                                }} className="ml-1.5 hover:text-destructive" aria-label="Remove search filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {role !== 'all' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                Role: {role}
                                <button onClick={() => {
                                    setRole('all');
                                    applyFilters();
                                }} className="ml-1.5 hover:text-destructive" aria-label="Remove role filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {verified !== 'all' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {verified === 'verified' ? 'Verified' : 'Unverified'}
                                <button onClick={() => {
                                    setVerified('all');
                                    applyFilters();
                                }} className="ml-1.5 hover:text-destructive" aria-label="Remove status filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateFrom && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                From {formatDate(dateFrom)}
                                <button onClick={() => {
                                    setDateFrom('');
                                    applyFilters();
                                }} className="ml-1.5 hover:text-destructive" aria-label="Remove from date filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateTo && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                To {formatDate(dateTo)}
                                <button onClick={() => {
                                    setDateTo('');
                                    applyFilters();
                                }} className="ml-1.5 hover:text-destructive" aria-label="Remove to date filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border px-4 py-3 sm:px-6">
                        <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {users.data.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                {hasActiveFilters()
                                    ? 'No users match your current filters.'
                                    : 'No users have been added yet.'}
                                {can.manage && !hasActiveFilters() && (
                                    <Link
                                        href="/settings/application-settings/users/create"
                                        className="ml-1 font-semibold underline underline-offset-4"
                                    >
                                        Add the first user.
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <Table className="hidden sm:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right w-28">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.data.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-[10px]">
                                                                {initials(user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-[200px]">
                                                    <div className="truncate">{user.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.length > 0 ? (
                                                            user.roles.map((userRole) => (
                                                                <span
                                                                    key={userRole}
                                                                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20 capitalize"
                                                                >
                                                                    {userRole}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No role</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.email_verified_at ? (
                                                        <Badge variant="secondary" className="text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                            <ClockIcon className="mr-1 h-3 w-3" />
                                                            Unverified
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                                    {formatDate(user.created_at)}
                                                </TableCell>
                                                {can.manage && (
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button asChild variant="ghost" size="sm">
                                                                <Link href={`/settings/application-settings/users/${user.id}/edit`}>
                                                                    <PencilIcon className="h-4 w-4" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => setDeleteTarget(user.id)}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
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
                                    {users.data.map((user) => (
                                        <div key={user.id} className="p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 shrink-0">
                                                    <AvatarFallback>
                                                        {initials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                                {user.email_verified_at ? (
                                                    <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        Unverified
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((userRole) => (
                                                        <span
                                                            key={userRole}
                                                            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20 capitalize"
                                                        >
                                                            {userRole}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No role</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                                <span className="text-xs text-muted-foreground">
                                                    Joined {formatDate(user.created_at)}
                                                </span>
                                                {can.manage && (
                                                    <div className="flex items-center gap-1">
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/settings/application-settings/users/${user.id}/edit`}>
                                                                <PencilIcon className="h-4 w-4 mr-1.5" />
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(user.id)}
                                                        >
                                                            <TrashIcon className="h-4 w-4 mr-1.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {users.last_page > 1 && (
                                    <div className="border-t border-border px-4 py-3 sm:px-6">
                                        <Pagination links={users.links} />
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
                title="Delete User"
                description="This action cannot be undone. The user will permanently lose access to the system."
                confirmLabel="Delete User"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

UsersIndex.layout = { breadcrumbs };
