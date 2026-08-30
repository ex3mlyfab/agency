import { Head, Link, router } from '@inertiajs/react';
import {
    ShieldCheckIcon,
    SearchIcon,
    XIcon,
    FilterIcon,
    CalendarIcon,
    UserIcon,
    FileTextIcon,
    TrendingDownIcon,
} from 'lucide-react';
import { useState } from 'react';
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
import { useCurrency, fmtCurrency } from '@/lib/currency';

interface Deceased {
    id: string;
    first_name: string;
    last_name: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
}

interface Waiver {
    id: string;
    deceased: Deceased | null;
    invoice: Invoice | null;
    amount: string | number;
    reason: string | null;
    authorized_at: string;
    authorized_by_user: { id: string; name: string } | null;
    created_at: string;
}

interface PaginatedWaivers {
    data: Waiver[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: any[];
}

interface Summary {
    total_waivers: number;
    total_waived: number;
    invoices_affected: number;
    deceased_affected: number;
}

interface Authorizer {
    id: string;
    name: string;
}

interface Props {
    waivers: PaginatedWaivers;
    filters: {
        search?: string;
        date_from?: string;
        date_to?: string;
        authorized_by?: string;
    };
    summary: Summary;
    authorizers: Authorizer[];
    can: { manage: boolean };
}

export default function WaiversIndex({ waivers, filters, summary, authorizers, can }: Props) {
    const symbol = useCurrency();
    const [search, setSearch] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [authorizedBy, setAuthorizedBy] = useState(filters.authorized_by || 'all');
    const [filtersOpen, setFiltersOpen] = useState(false);

    function applyFilters() {
        router.get(
            '/waivers',
            {
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                authorized_by: authorizedBy === 'all' ? undefined : authorizedBy,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['waivers', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setAuthorizedBy('all');
        router.get(
            '/waivers',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['waivers', 'filters'],
            },
        );
    }

    function hasActiveFilters() {
        return !!(search || dateFrom || dateTo || authorizedBy !== 'all');
    }

    return (
        <>
            <Head title="Waivers" />
            <div className="space-y-6 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Waivers
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {waivers.total > 0
                                ? `Showing ${waivers.from}–${waivers.to} of ${waivers.total} waivers`
                                : 'No waivers on file'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild className="shrink-0">
                            <Link href="/waivers/create">
                                <ShieldCheckIcon className="mr-2 h-4 w-4" />
                                New Waiver
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-violet-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                <ShieldCheckIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {summary.total_waivers}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Total Waivers
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                                <TrendingDownIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {fmtCurrency(summary.total_waived, symbol)}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Total Waived
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                <FileTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {summary.invoices_affected}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Invoices Affected
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                <UserIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {summary.deceased_affected}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Records Affected
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="flex items-center gap-2 border-b border-border p-3">
                            <div className="relative flex-1 min-w-0">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by invoice #, deceased name, or reason…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 pr-9"
                                    aria-label="Search waivers"
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
                                        From Date
                                    </Label>
                                    <div className="relative">
                                        <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="date-from"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) =>
                                                setDateFrom(e.target.value)
                                            }
                                            className="pl-8 h-9"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="date-to"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        To Date
                                    </Label>
                                    <div className="relative">
                                        <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="date-to"
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) =>
                                                setDateTo(e.target.value)
                                            }
                                            className="pl-8 h-9"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="authorizer-filter"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Authorized By
                                    </Label>
                                    <Select
                                        value={authorizedBy}
                                        onValueChange={setAuthorizedBy}
                                    >
                                        <SelectTrigger
                                            id="authorizer-filter"
                                            className="w-[160px]"
                                        >
                                            <SelectValue placeholder="All authorizers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All authorizers
                                            </SelectItem>
                                            {authorizers.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id}
                                                >
                                                    {user.name}
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
                        {authorizedBy !== 'all' && (
                            <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                            >
                                <UserIcon className="mr-1 h-3 w-3" />
                                {
                                    authorizers.find((u) => u.id === authorizedBy)
                                        ?.name
                                }
                                <button
                                    onClick={() => {
                                        setAuthorizedBy('all');
                                        applyFilters();
                                    }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove authorizer filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}

                <Card>
                    <CardHeader className="border-b border-border px-6 py-3">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Waiver Ledger
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {waivers.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No waivers found</AlertTitle>
                                    <AlertDescription>
                                        {hasActiveFilters()
                                            ? 'No waivers match your current filters.'
                                            : 'No waivers have been recorded yet.'}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <>
                                <Table className="hidden sm:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Deceased</TableHead>
                                            <TableHead className="text-right">Amount Waived</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Authorized By</TableHead>
                                            <TableHead>Date Authorized</TableHead>
                                            <TableHead className="w-24 text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waivers.data.map((waiver) => {
                                            const amount = parseFloat(
                                                waiver.amount as string,
                                            );

                                            return (
                                                <TableRow key={waiver.id}>
                                                    <TableCell className="font-semibold text-foreground">
                                                        {waiver.invoice ? (
                                                            <Link
                                                                href={`/invoices/${waiver.invoice.id}`}
                                                                className="hover:underline text-primary"
                                                            >
                                                                {waiver.invoice.invoice_number}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-foreground max-w-[160px]">
                                                        {waiver.deceased ? (
                                                            <Link
                                                                href={`/deceased/${waiver.deceased.id}`}
                                                                className="hover:underline text-primary"
                                                            >
                                                                {waiver.deceased.first_name}{' '}
                                                                {waiver.deceased.last_name}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                                                        {fmtCurrency(-amount, symbol)}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                                                        {waiver.reason || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">
                                                        {waiver.authorized_by_user
                                                            ? waiver.authorized_by_user.name
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                                        {new Date(
                                                            waiver.authorized_at,
                                                        ).toLocaleDateString(
                                                            'en-GB',
                                                            {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/waivers/${waiver.id}`}
                                                                >
                                                                    <ShieldCheckIcon className="h-4 w-4" />
                                                                    <span className="sr-only">
                                                                        View
                                                                    </span>
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                <div className="sm:hidden divide-y divide-border">
                                    {waivers.data.map((waiver) => {
                                        const amount = parseFloat(
                                            waiver.amount as string,
                                        );

                                        return (
                                            <div
                                                key={waiver.id}
                                                className="p-4 space-y-3"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-foreground truncate">
                                                            {waiver.invoice
                                                                ? waiver.invoice.invoice_number
                                                                : '—'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {waiver.deceased
                                                                ? `${waiver.deceased.first_name} ${waiver.deceased.last_name}`
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 font-medium text-rose-600 dark:text-rose-400 text-sm">
                                                        {fmtCurrency(-amount, symbol)}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Reason
                                                        </span>
                                                        <p className="font-medium text-foreground truncate">
                                                            {waiver.reason || '—'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Authorized
                                                        </span>
                                                        <p className="font-medium text-muted-foreground">
                                                            {waiver.authorized_by_user?.name || '—'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Date
                                                        </span>
                                                        <p className="font-medium text-muted-foreground">
                                                            {new Date(
                                                                waiver.authorized_at,
                                                            ).toLocaleDateString(
                                                                'en-GB',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                },
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/waivers/${waiver.id}`}
                                                        >
                                                            <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {waivers.last_page > 1 && (
                                    <div className="border-t border-border px-6 py-3">
                                        <Pagination
                                            links={waivers.links}
                                        />
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

WaiversIndex.layout = {
    breadcrumbs: [{ title: 'Waivers', href: '/waivers' }],
};
