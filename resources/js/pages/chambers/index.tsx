import { Head, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon,
    MoveRightIcon,
    UserIcon,
    UsersIcon,
    BuildingIcon,
    SearchIcon,
    XIcon,
    LayoutGridIcon,
    ListIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Chamber {
    id: string;
    name: string;
    location: string | null;
    capacity: number;
    occupants_count: number;
    occupancy_status: 'In use' | 'Empty';
    days_in_chamber: number | null;
    service?: { id: string; name: string } | null;
}

interface PaginatedChambers {
    data: Chamber[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    search: string;
    status: string;
    service_id: string;
}

interface Props {
    chambers: PaginatedChambers;
    services: { id: string; name: string }[];
    stats: { total: number; occupied: number; empty: number; totalSlots: number; usedSlots: number; freeSlots: number };
    filters: Filters;
    can: { manage: boolean; viewHistory: boolean; transfer: boolean };
}

export default function ChambersIndex({ chambers, services, stats, filters, can }: Props) {
    const items = chambers?.data ?? [];
    const links = chambers?.links ?? [];
    const total = chambers?.total ?? 0;
    const currentPage = chambers?.current_page ?? 1;
    const lastPage = chambers?.last_page ?? 1;
    const from = chambers?.from ?? 0;
    const to = chambers?.to ?? 0;
    const safeServices = services ?? [];

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ? filters.status : 'all');
    const [serviceId, setServiceId] = useState(filters.service_id ? filters.service_id : 'all');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        try {
            return (localStorage.getItem('chambers-view') as 'grid' | 'list') || 'grid';
        } catch {
            return 'grid';
        }
    });

    function applyFilters() {
        router.get(
            '/chambers',
            { search, status: status === 'all' ? '' : status, service_id: serviceId === 'all' ? '' : serviceId || null },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['chambers', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setStatus('all');
        setServiceId('all');
        router.get('/chambers', {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['chambers', 'filters'],
        });
    }

    function handleDelete() {
        if (!deleteTarget) {
return;
}

        setIsDeleting(true);
        router.delete(`/chambers/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    function hasActiveFilters() {
        return !!(search || status !== 'all' || serviceId !== 'all');
    }

    return (
        <>
            <Head title="Chambers" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Chamber Indicator
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {total > 0
                                ? `Showing ${from}–${to} of ${total} chambers`
                                : 'No chambers configured'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild>
                            <Link href="/chambers/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Chamber
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <LayoutGridIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold leading-none">
                                    {stats.total}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Total Chambers
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                                <UsersIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold leading-none">
                                    {stats.occupied}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Occupied
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/10">
                                <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold leading-none">
                                    {stats.empty}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Available
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                                <LayoutGridIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold leading-none">
                                    {stats.freeSlots}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Free slots
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filters */}
                <Card>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
                        <div className="relative flex-1">
                            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name or location…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="pl-9 pr-9"
                            />
                            {search && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        applyFilters();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <Select value={status} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="empty">Available</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={serviceId} onValueChange={(v) => setServiceId(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-[160px] shrink-0">
                                <SelectValue placeholder="All services" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All services</SelectItem>
                                {safeServices.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={applyFilters} className="shrink-0">
                                Search
                            </Button>
                            {hasActiveFilters() && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                                    Clear
                                </Button>
                            )}
                            <div className="ml-auto flex items-center gap-0.5 rounded-md border border-border p-0.5">
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                        setViewMode('grid');

                                        try {
 localStorage.setItem('chambers-view', 'grid'); 
} catch {}
                                    }}
                                >
                                    <LayoutGridIcon className={`h-4 w-4 ${viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}`} />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                        setViewMode('list');

                                        try {
 localStorage.setItem('chambers-view', 'list'); 
} catch {}
                                    }}
                                >
                                    <ListIcon className={`h-4 w-4 ${viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}`} />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {items.length === 0 ? (
                    <Alert>
                        <AlertTitle>No chambers found</AlertTitle>
                        <AlertDescription>
                            {hasActiveFilters()
                                ? 'No chambers match your current filters.'
                                : 'No chambers have been added yet.'}
                            {can.manage && !hasActiveFilters() && (
                                <span className="ml-1">
                                    <Link
                                        href="/chambers/create"
                                        className="font-semibold underline underline-offset-4"
                                    >
                                        Add the first chamber.
                                    </Link>
                                </span>
                            )}
                        </AlertDescription>
                    </Alert>
                ) : viewMode === 'grid' ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {items.map((chamber) => {
                            const isOccupied = chamber.occupancy_status === 'In use';

                            return (
                                <Card key={chamber.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
                                    <div className={`absolute inset-x-0 top-0 h-1 ${isOccupied ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    <CardHeader className="pb-2 pl-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="truncate text-base font-semibold">{chamber.name}</CardTitle>
                                                {chamber.location && (
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <BuildingIcon className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{chamber.location}</span>
                                                    </p>
                                                )}
                                                {chamber.service && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">{chamber.service.name}</p>
                                                )}
                                            </div>
                                            <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                isOccupied
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                                <span className={`inline-block h-1.5 w-1.5 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {isOccupied ? 'Occupied' : 'Available'}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pl-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                {isOccupied ? <UsersIcon className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                                                <span>{chamber.occupants_count}/{chamber.capacity} slot{chamber.capacity > 1 ? 's' : ''}</span>
                                            </div>
                                            {isOccupied && chamber.days_in_chamber !== null && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <ClockIcon className="h-3.5 w-3.5" />
                                                    <span>{chamber.days_in_chamber === 0 ? 'Today' : `${chamber.days_in_chamber}d`}</span>
                                                </div>
                                            )}
                                        </div>
                                        {chamber.capacity > 1 && (
                                            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-1 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                    style={{ width: `${Math.min(100, Math.round((chamber.occupants_count / chamber.capacity) * 100))}%` }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/chambers/${chamber.id}/history`}>
                                                    <ClockIcon className="mr-1.5 h-3.5 w-3.5" />
                                                    History
                                                </Link>
                                            </Button>
                                            {can.transfer && isOccupied && (
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/transfers/create?chamber_id=${chamber.id}`}>
                                                        <MoveRightIcon className="mr-1.5 h-3.5 w-3.5" />
                                                        Transfer
                                                    </Link>
                                                </Button>
                                            )}
                                            {can.manage && (
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/chambers/${chamber.id}/edit`}>
                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            )}
                                            {can.manage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteTarget(chamber.id)}
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occupancy</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Days</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((chamber) => {
                                        const isOccupied = chamber.occupancy_status === 'In use';

                                        return (
                                            <tr key={chamber.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-2.5 font-medium">{chamber.name}</td>
                                                <td className="px-4 py-2.5 text-muted-foreground">{chamber.location ?? '—'}</td>
                                                <td className="px-4 py-2.5 text-muted-foreground">{chamber.service?.name ?? '—'}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                        isOccupied
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        {isOccupied ? 'Occupied' : 'Available'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">{chamber.occupants_count}/{chamber.capacity}</td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {isOccupied && chamber.days_in_chamber !== null
                                                        ? chamber.days_in_chamber === 0 ? 'Today' : `${chamber.days_in_chamber}d`
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/chambers/${chamber.id}/history`}>
                                                                <ClockIcon className="h-4 w-4" />
                                                                <span className="sr-only">History</span>
                                                            </Link>
                                                        </Button>
                                                        {can.transfer && isOccupied && (
                                                            <Button asChild variant="ghost" size="sm">
                                                                <Link href={`/transfers/create?chamber_id=${chamber.id}`}>
                                                                    <MoveRightIcon className="h-4 w-4" />
                                                                    <span className="sr-only">Transfer</span>
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {can.manage && (
                                                            <Button asChild variant="ghost" size="sm">
                                                                <Link href={`/chambers/${chamber.id}/edit`}>
                                                                    <PencilIcon className="h-4 w-4" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {can.manage && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => setDeleteTarget(chamber.id)}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {lastPage}
                        </span>
                        <Pagination links={links} />
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete chamber"
                description="This will permanently remove the chamber. This action cannot be undone. Chambers with current occupants cannot be deleted."
                confirmLabel="Delete Chamber"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

ChambersIndex.layout = {
    breadcrumbs: [{ title: 'Chambers', href: '/chambers' }],
};
