import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRightLeftIcon,
    LogInIcon,
    LogOutIcon,
    SearchIcon,
    XIcon,
    FilterIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { StatusChip } from '@/components/status-chip';
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

interface Transfer {
    id: string;
    event_type: string;
    transferred_at: string;
    notes: string | null;
    deceased: { id: string; first_name: string; last_name: string } | null;
    from_chamber: { name: string } | null;
    to_chamber: { name: string } | null;
    transferred_by_user: { name: string } | null;
}

interface PaginatedTransfers {
    data: Transfer[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    search: string;
    event_type: string;
    date_from: string;
    date_to: string;
}

interface Stats {
    total: number;
    entered: number;
    transferred: number;
    released: number;
}

interface Props {
    transfers: PaginatedTransfers;
    stats: Stats;
    filters: Filters;
    users: { id: string; name: string }[];
    can: { create: boolean };
}

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

function formatDateTime(date: string): string {
    if (!date) {
return '—';
}

    const d = new Date(date);

    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function TransfersIndex({ transfers, stats, filters, users, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [eventType, setEventType] = useState(filters.event_type ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [filtersOpen, setFiltersOpen] = useState(false);

    function applyFilters() {
        router.get(
            '/transfers',
            {
                search: search || undefined,
                event_type: eventType === 'all' ? undefined : eventType,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['transfers', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setEventType('all');
        setDateFrom('');
        setDateTo('');
        router.get('/transfers', {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['transfers', 'filters'],
        });
    }

    function hasActiveFilters() {
        return !!(search || eventType !== 'all' || dateFrom || dateTo);
    }

    const total = transfers.total ?? 0;
    const from = transfers.from ?? 0;
    const to = transfers.to ?? 0;
    const lastPage = transfers.last_page ?? 1;
    const currentPage = transfers.current_page ?? 1;
    const links = transfers.links ?? [];
    const items = transfers.data ?? [];

    return (
        <>
            <Head title="Transfer Log" />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Transfer Log
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {total > 0
                                ? `Showing ${from}–${to} of ${total} events`
                                : 'No transfer events recorded'}
                        </p>
                    </div>
                    {can.create && (
                        <Button asChild className="shrink-0">
                            <Link href="/transfers/create">
                                <ArrowRightLeftIcon className="mr-2 h-4 w-4" />
                                Record Transfer
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-500/10">
                                <ClockIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {stats.total}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Total Events
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                <LogInIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {stats.entered}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Admissions
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                <ArrowRightLeftIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {stats.transferred}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Transfers
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                <LogOutIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {stats.released}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Releases
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-2 overflow-hidden lg:col-span-1">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-violet-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                <UserIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {users.length}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Staff
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
                                    placeholder="Search by deceased name…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 pr-9"
                                    aria-label="Search deceased records"
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
                                filtersOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="flex flex-wrap items-end gap-3 p-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="event-type-filter" className="text-xs font-medium text-muted-foreground">
                                        Event Type
                                    </Label>
                                    <Select value={eventType} onValueChange={setEventType}>
                                        <SelectTrigger id="event-type-filter" className="w-[140px]">
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All types</SelectItem>
                                            <SelectItem value="Entered">Admitted</SelectItem>
                                            <SelectItem value="Transferred">Transferred</SelectItem>
                                            <SelectItem value="Released">Released</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="date-from" className="text-xs font-medium text-muted-foreground">
                                        From Date
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
                                        To Date
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
 setSearch(''); applyFilters(); 
}} className="ml-1.5 hover:text-destructive" aria-label="Remove search filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {eventType !== 'all' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {eventType}
                                <button onClick={() => {
 setEventType('all'); applyFilters(); 
}} className="ml-1.5 hover:text-destructive" aria-label="Remove event type filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateFrom && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                From {formatDate(dateFrom)}
                                <button onClick={() => {
 setDateFrom(''); applyFilters(); 
}} className="ml-1.5 hover:text-destructive" aria-label="Remove from date filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateTo && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                To {formatDate(dateTo)}
                                <button onClick={() => {
 setDateTo(''); applyFilters(); 
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
                            Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {items.length === 0 ? (
                            <div className="p-8">
                                <Alert>
                                    <AlertTitle>No events found</AlertTitle>
                                    <AlertDescription>
                                        {hasActiveFilters()
                                            ? 'No transfer events match your current filters.'
                                            : 'No transfer events have been recorded.'}
                                        {can.create && !hasActiveFilters() && (
                                            <Link
                                                href="/transfers/create"
                                                className="ml-1 font-semibold underline underline-offset-4"
                                            >
                                                Record the first transfer.
                                            </Link>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <Table className="hidden sm:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Deceased</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>By</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell>
                                                    <StatusChip status={t.event_type} />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {t.deceased ? (
                                                        <Link
                                                            href={`/deceased/${t.deceased.id}`}
                                                            className="hover:underline"
                                                        >
                                                            {t.deceased.first_name}{' '}
                                                            {t.deceased.last_name}
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {t.from_chamber?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {t.to_chamber?.name ??
                                                        t.event_type === 'Released' ? 'Released' : '—'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {t.transferred_by_user?.name ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                                    {formatDateTime(t.transferred_at)}
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <div className="truncate text-muted-foreground" title={t.notes ?? ''}>
                                                        {t.notes ?? '—'}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Mobile card list */}
                                <div className="sm:hidden divide-y divide-border">
                                    {items.map((t) => (
                                        <div key={t.id} className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <StatusChip status={t.event_type} />
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDateTime(t.transferred_at)}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Deceased:</span>
                                                    <span className="font-medium">
                                                        {t.deceased
                                                            ? `${t.deceased.first_name} ${t.deceased.last_name}`
                                                            : '—'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">From:</span>
                                                    <span className="font-medium">{t.from_chamber?.name ?? '—'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">To:</span>
                                                    <span className="font-medium">
                                                        {t.to_chamber?.name ??
                                                            t.event_type === 'Released' ? 'Released' : '—'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">By:</span>
                                                    <span className="font-medium">
                                                        {t.transferred_by_user?.name ?? '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            {t.notes && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    "{t.notes}"
                                                </p>
                                            )}
                                            {t.deceased && (
                                                <div className="pt-1 border-t border-border/50">
                                                    <Link
                                                        href={`/deceased/${t.deceased.id}`}
                                                        className="text-xs font-medium text-primary hover:underline"
                                                    >
                                                        View deceased record →
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {lastPage > 1 && (
                                    <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-6">
                                        <span className="text-xs text-muted-foreground">
                                            Page {currentPage} of {lastPage}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {links.map((link) => (
                                                <Button
                                                    key={link.label}
                                                    asChild={!!link.url}
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    className="h-7 min-w-7 px-1.5 text-xs"
                                                >
                                                    {link.url ? (
                                                        <Link
                                                            href={link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ) : (
                                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TransfersIndex.layout = {
    breadcrumbs: [{ title: 'Transfers', href: '/transfers' }],
};
