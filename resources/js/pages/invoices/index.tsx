import { Head, Link, router } from '@inertiajs/react';
import {
    EyeIcon,
    SearchIcon,
    XIcon,
    FilterIcon,
    FileTextIcon,
    CheckCircle2Icon,
    AlertCircleIcon,
    WalletIcon,
    CalendarIcon,
    UserIcon,
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
    deceased: Deceased | null;
    total_amount: string | number;
    paid_amount: string | number;
    waived_amount: string | number;
    status: string;
    created_at: string;
    created_by_user: { id: string; name: string } | null;
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: any[];
}

interface Summary {
    total_invoices: number;
    paid: { count: number; total: number };
    unpaid: { count: number; balance: number };
    partially_paid: { count: number; balance: number };
}

interface Props {
    invoices: PaginatedInvoices;
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        created_by?: string;
    };
    summary: Summary;
    statuses: string[];
    creators: { id: string; name: string }[];
    can: { manage: boolean };
}

export default function InvoicesIndex({
    invoices,
    filters,
    summary,
    statuses,
    creators,
    can,
}: Props) {
    const symbol = useCurrency();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [createdBy, setCreatedBy] = useState(filters.created_by || 'all');
    const [filtersOpen, setFiltersOpen] = useState(false);

    function applyFilters() {
        router.get(
            '/invoices',
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                created_by: createdBy === 'all' ? undefined : createdBy,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['invoices', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setStatus('all');
        setDateFrom('');
        setDateTo('');
        setCreatedBy('all');
        router.get(
            '/invoices',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['invoices', 'filters'],
            },
        );
    }

    function hasActiveFilters() {
        return !!(
            search ||
            status !== 'all' ||
            dateFrom ||
            dateTo ||
            createdBy !== 'all'
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-success/15 text-success border border-success/30';
            case 'partially_paid':
            case 'partially paid':
                return 'bg-warning/15 text-warning border border-warning/30';
            case 'unpaid':
                return 'bg-destructive/15 text-destructive border border-destructive/30';
            case 'draft':
                return 'bg-muted text-foreground border border-border';
            default:
                return 'bg-info/15 text-info border border-info/30';
        }
    };

    return (
        <>
            <Head title="Invoices" />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Invoices
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {invoices.total > 0
                                ? `Showing ${invoices.from}–${invoices.to} of ${invoices.total} invoices`
                                : 'No invoices on file'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild className="shrink-0">
                            <Link href="/invoices/create">
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                New Invoice
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Card className="overflow-hidden border-l-4 border-l-primary bg-primary/[0.07]">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <FileTextIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-2xl leading-none font-bold">
                                    {summary.total_invoices}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    Total Invoices
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-l-4 border-l-success bg-success/[0.07]">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-success" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                                <CheckCircle2Icon className="h-4 w-4 text-success" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-2xl leading-none font-bold">
                                    {summary.paid.count}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {fmtCurrency(summary.paid.total, symbol)}{' '}
                                    collected
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-l-4 border-l-destructive bg-destructive/[0.07]">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-destructive" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                                <AlertCircleIcon className="h-4 w-4 text-destructive" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-2xl leading-none font-bold">
                                    {summary.unpaid.count}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {fmtCurrency(
                                        summary.unpaid.balance,
                                        symbol,
                                    )}{' '}
                                    outstanding
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-l-4 border-l-warning bg-warning/[0.07]">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-warning" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                                <WalletIcon className="h-4 w-4 text-warning" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-2xl leading-none font-bold">
                                    {summary.partially_paid.count}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {fmtCurrency(
                                        summary.partially_paid.balance,
                                        symbol,
                                    )}{' '}
                                    remaining
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
                            <div className="relative min-w-0 flex-1">
                                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by invoice number or deceased name…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && applyFilters()
                                    }
                                    className="pr-9 pl-9"
                                    aria-label="Search invoices"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            applyFilters();
                                        }}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                        {/* Collapsible filter row */}
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
                                        htmlFor="status-filter"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Status
                                    </Label>
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger
                                            id="status-filter"
                                            className="w-[150px]"
                                        >
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            {statuses.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="date-from"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        From Date
                                    </Label>
                                    <div className="relative">
                                        <CalendarIcon className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="date-from"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) =>
                                                setDateFrom(e.target.value)
                                            }
                                            className="h-9 pl-8"
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
                                        <CalendarIcon className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="date-to"
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) =>
                                                setDateTo(e.target.value)
                                            }
                                            className="h-9 pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="creator-filter"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Created By
                                    </Label>
                                    <Select
                                        value={createdBy}
                                        onValueChange={setCreatedBy}
                                    >
                                        <SelectTrigger
                                            id="creator-filter"
                                            className="w-[160px]"
                                        >
                                            <SelectValue placeholder="All creators" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All creators
                                            </SelectItem>
                                            {creators.map((user) => (
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

                {/* Active filter badges */}
                {hasActiveFilters() && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Active filters:
                        </span>
                        {search && (
                            <Badge
                                variant="outline"
                                className="px-2 py-0.5 text-xs"
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
                        {status !== 'all' && (
                            <Badge
                                variant="outline"
                                className="px-2 py-0.5 text-xs"
                            >
                                {status}
                                <button
                                    onClick={() => {
                                        setStatus('all');
                                        applyFilters();
                                    }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove status filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateFrom && (
                            <Badge
                                variant="outline"
                                className="px-2 py-0.5 text-xs"
                            >
                                From{' '}
                                {new Date(dateFrom).toLocaleDateString(
                                    'en-GB',
                                    {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    },
                                )}
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
                                className="px-2 py-0.5 text-xs"
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
                        {createdBy !== 'all' && (
                            <Badge
                                variant="outline"
                                className="px-2 py-0.5 text-xs"
                            >
                                <UserIcon className="mr-1 h-3 w-3" />
                                {creators.find((u) => u.id === createdBy)?.name}
                                <button
                                    onClick={() => {
                                        setCreatedBy('all');
                                        applyFilters();
                                    }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove creator filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border/60 bg-secondary/50 px-6 py-3 dark:bg-secondary/30">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Billing Ledger
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {invoices.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No invoices found</AlertTitle>
                                    <AlertDescription>
                                        {hasActiveFilters()
                                            ? 'No invoices match your current filters.'
                                            : 'No invoices have been created yet.'}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <Table className="hidden sm:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Deceased</TableHead>
                                            <TableHead>Total Amount</TableHead>
                                            <TableHead>Paid Amount</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created By</TableHead>
                                            <TableHead>Date Created</TableHead>
                                            <TableHead className="w-24 text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.data.map((invoice) => {
                                            const total = parseFloat(
                                                invoice.total_amount as string,
                                            );
                                            const paid = parseFloat(
                                                invoice.paid_amount as string,
                                            );
                                            const waived = parseFloat(
                                                invoice.waived_amount as string,
                                            );
                                            const balance =
                                                total - paid - waived;

                                            return (
                                                <TableRow key={invoice.id}>
                                                    <TableCell className="font-semibold text-foreground">
                                                        {invoice.invoice_number}
                                                    </TableCell>
                                                    <TableCell className="max-w-[160px] font-medium text-foreground">
                                                        {invoice.deceased ? (
                                                            <Link
                                                                href={`/deceased/${invoice.deceased.id}`}
                                                                className="text-primary hover:underline"
                                                            >
                                                                {
                                                                    invoice
                                                                        .deceased
                                                                        .first_name
                                                                }{' '}
                                                                {
                                                                    invoice
                                                                        .deceased
                                                                        .last_name
                                                                }
                                                            </Link>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {fmtCurrency(
                                                            total,
                                                            symbol,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-success">
                                                        {fmtCurrency(
                                                            paid,
                                                            symbol,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-destructive">
                                                        {fmtCurrency(
                                                            balance,
                                                            symbol,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                                                                invoice.status,
                                                            )}`}
                                                        >
                                                            {invoice.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {invoice.created_by_user
                                                            ? invoice
                                                                  .created_by_user
                                                                  .name
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                                        {new Date(
                                                            invoice.created_at,
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
                                                                    href={`/invoices/${invoice.id}`}
                                                                >
                                                                    <EyeIcon className="h-4 w-4" />
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

                                {/* Mobile card list */}
                                <div className="divide-y divide-border sm:hidden">
                                    {invoices.data.map((invoice) => {
                                        const total = parseFloat(
                                            invoice.total_amount as string,
                                        );
                                        const paid = parseFloat(
                                            invoice.paid_amount as string,
                                        );
                                        const waived = parseFloat(
                                            invoice.waived_amount as string,
                                        );
                                        const balance = total - paid - waived;

                                        return (
                                            <div
                                                key={invoice.id}
                                                className="space-y-3 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-foreground">
                                                            {
                                                                invoice.invoice_number
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {invoice.deceased
                                                                ? `${invoice.deceased.first_name} ${invoice.deceased.last_name}`
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                                                            invoice.status,
                                                        )}`}
                                                    >
                                                        {invoice.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Total
                                                        </span>
                                                        <p className="font-medium text-foreground">
                                                            {fmtCurrency(
                                                                total,
                                                                symbol,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Paid
                                                        </span>
                                                        <p className="font-medium text-success">
                                                            {fmtCurrency(
                                                                paid,
                                                                symbol,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Balance
                                                        </span>
                                                        <p className="font-medium text-destructive">
                                                            {fmtCurrency(
                                                                balance,
                                                                symbol,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Created
                                                        </span>
                                                        <p className="font-medium text-muted-foreground">
                                                            {new Date(
                                                                invoice.created_at,
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
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground">
                                                            By
                                                        </span>
                                                        <p className="font-medium text-muted-foreground">
                                                            {invoice.created_by_user
                                                                ? invoice
                                                                      .created_by_user
                                                                      .name
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end gap-1 border-t border-border/50 pt-1">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/invoices/${invoice.id}`}
                                                        >
                                                            <EyeIcon className="mr-1.5 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {invoices.last_page > 1 && (
                                    <div className="border-t border-border px-6 py-3">
                                        <Pagination links={invoices.links} />
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

InvoicesIndex.layout = {
    breadcrumbs: [{ title: 'Invoices', href: '/invoices' }],
};
