import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowUpDownIcon,
    BanknoteIcon,
    CreditCardIcon,
    EyeIcon,
    FilterXIcon,
    ReceiptIcon,
    SearchIcon,
    WalletIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCurrency, fmtCurrency } from '@/lib/currency';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deceased {
    id: string;
    first_name: string;
    last_name: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
}

interface Payment {
    id: string;
    receipt_number: string;
    deceased: Deceased | null;
    invoice: Invoice | null;
    amount: string | number;
    payment_method: string;
    transaction_reference: string | null;
    payment_date: string;
}

interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: any[];
}

interface Stats {
    total_amount: number;
    total_count: number;
    deposit_count: number;
    invoice_count: number;
    by_method: Record<string, number>;
}

interface Filters {
    search?: string;
    period?: string;
    date_from?: string;
    date_to?: string;
    payment_method?: string;
    per_page?: string;
    sort_by?: string;
    sort_dir?: string;
}

interface Props {
    payments: PaginatedPayments;
    filters: Filters;
    stats: Stats;
    paymentMethods: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'custom', label: 'Custom Range' },
];

const PER_PAGE_OPTIONS = [
    { value: '15', label: '15 / page' },
    { value: '25', label: '25 / page' },
    { value: '50', label: '50 / page' },
];

type SortKey = 'payment_date' | 'amount' | 'receipt_number' | 'payment_method';

// ─── Helpers ──────────────────────────────────────────────────────────────────


function topMethod(byMethod: Record<string, number>): string | null {
    const entries = Object.entries(byMethod);

    if (!entries.length) {
return null;
}

    return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ─── Snapshot Card ────────────────────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: 'emerald' | 'blue' | 'violet' | 'amber';
}) {
    const accentMap = {
        emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
        violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-600 dark:text-violet-400',
        amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
    };
    const cls = accentMap[accent ?? 'emerald'];

    return (
        <Card className={`bg-gradient-to-br border ${cls} transition-all duration-200 hover:shadow-md`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                    </div>
                    <div className={`rounded-lg p-2.5 bg-background/50 ${cls.split(' ').slice(-1)[0]}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ column, active, dir }: { column: SortKey; active: SortKey; dir: string }) {
    if (column !== active) {
return <ArrowUpDownIcon className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/50" />;
}

    return dir === 'asc'
        ? <ArrowUpIcon className="ml-1 inline h-3.5 w-3.5 text-primary" />
        : <ArrowDownIcon className="ml-1 inline h-3.5 w-3.5 text-primary" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentsIndex({ payments, filters, stats, paymentMethods }: Props) {
    const symbol = useCurrency();
    const [search, setSearch] = useState(filters.search ?? '');
    const [period, setPeriod] = useState(filters.period ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? 'all');
    const [perPage, setPerPage] = useState(filters.per_page ?? '15');
    const [sortBy, setSortBy] = useState<SortKey>((filters.sort_by as SortKey) ?? 'payment_date');
    const [sortDir, setSortDir] = useState(filters.sort_dir ?? 'desc');

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Push current filter state to the server */
    const applyFilters = useCallback(
        (overrides: Partial<Filters & { sort_by: string; sort_dir: string }> = {}) => {
            const params: Record<string, string> = {};
            const s = overrides.search ?? search;
            const p = overrides.period ?? period;
            const df = overrides.date_from ?? dateFrom;
            const dt = overrides.date_to ?? dateTo;
            const pm = overrides.payment_method ?? paymentMethod;
            const pp = overrides.per_page ?? perPage;
            const sb = overrides.sort_by ?? sortBy;
            const sd = overrides.sort_dir ?? sortDir;

            if (s) {
params.search = s;
}

            if (p && p !== 'all') {
params.period = p;
}

            if ((p === 'custom' || !p || p === 'all') && df) {
params.date_from = df;
}

            if ((p === 'custom' || !p || p === 'all') && dt) {
params.date_to = dt;
}

            if (pm && pm !== 'all') {
params.payment_method = pm;
}

            if (pp && pp !== '15') {
params.per_page = pp;
}

            if (sb) {
params.sort_by = sb;
}

            if (sd) {
params.sort_dir = sd;
}

            router.get('/payments', params, { preserveState: true, replace: true });
        },
        [search, period, dateFrom, dateTo, paymentMethod, perPage, sortBy, sortDir],
    );

    // Debounced search
    useEffect(() => {
        if (searchTimer.current) {
clearTimeout(searchTimer.current);
}

        searchTimer.current = setTimeout(() => applyFilters({ search }), 400);

        return () => {
            if (searchTimer.current) {
clearTimeout(searchTimer.current);
}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function handleSort(col: SortKey) {
        const newDir = sortBy === col && sortDir === 'desc' ? 'asc' : 'desc';
        setSortBy(col);
        setSortDir(newDir);
        applyFilters({ sort_by: col, sort_dir: newDir });
    }

    function handlePeriodChange(val: string) {
        setPeriod(val);

        if (val !== 'custom') {
            setDateFrom('');
            setDateTo('');
            applyFilters({ period: val, date_from: '', date_to: '' });
        } else {
            applyFilters({ period: val });
        }
    }

    function handleMethodChange(val: string) {
        setPaymentMethod(val);
        applyFilters({ payment_method: val });
    }

    function handlePerPageChange(val: string) {
        setPerPage(val);
        applyFilters({ per_page: val });
    }

    function handleDateApply() {
        applyFilters();
    }

    function handleReset() {
        setSearch('');
        setPeriod('all');
        setDateFrom('');
        setDateTo('');
        setPaymentMethod('all');
        setPerPage('15');
        setSortBy('payment_date');
        setSortDir('desc');
        router.get('/payments', {}, { preserveState: true, replace: true });
    }

    const showDatePickers = period === 'custom' || period === 'all';
    const hasFilters = search || (period && period !== 'all') || dateFrom || dateTo || (paymentMethod && paymentMethod !== 'all');
    const topMethodName = topMethod(stats.by_method);

    return (
        <>
            <Head title="Payments" />
            <div className="space-y-6 p-6">

                {/* ── Page Header ───────────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Payments</h1>
                    <p className="text-sm text-muted-foreground">
                        {payments.total > 0
                            ? `Showing ${payments.from}–${payments.to} of ${payments.total} payments`
                            : 'No payments match the current filters'}
                    </p>
                </div>

                {/* ── Snapshot Cards ────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        accent="emerald"
                        icon={<BanknoteIcon className="h-5 w-5" />}
                        label="Total Collected"
                        value={fmtCurrency(stats.total_amount, symbol)}
                        sub={`${stats.total_count} payment${stats.total_count !== 1 ? 's' : ''}`}
                    />
                    <StatCard
                        accent="blue"
                        icon={<ReceiptIcon className="h-5 w-5" />}
                        label="Invoice Payments"
                        value={String(stats.invoice_count)}
                        sub="applied to invoices"
                    />
                    <StatCard
                        accent="violet"
                        icon={<WalletIcon className="h-5 w-5" />}
                        label="Deposits"
                        value={String(stats.deposit_count)}
                        sub="direct account credits"
                    />
                    <StatCard
                        accent="amber"
                        icon={<CreditCardIcon className="h-5 w-5" />}
                        label="Top Method"
                        value={topMethodName ?? '—'}
                        sub={topMethodName ? fmtCurrency(stats.by_method[topMethodName], symbol) : 'no data'}
                    />
                </div>

                {/* ── Filter Bar ────────────────────────────────────────── */}
                <Card className="border-border/60">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Search */}
                            <div className="relative min-w-[200px] flex-1">
                                <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Receipt #, name, reference…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 pl-8"
                                />
                            </div>

                            {/* Period preset */}
                            <Select value={period} onValueChange={handlePeriodChange}>
                                <SelectTrigger className="h-9 w-[150px]">
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIOD_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Date pickers — shown for Custom / All Time */}
                            {showDatePickers && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="h-9 w-[140px]"
                                            placeholder="From"
                                        />
                                        <span className="text-xs text-muted-foreground">to</span>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="h-9 w-[140px]"
                                            placeholder="To"
                                        />
                                        <Button size="sm" variant="secondary" onClick={handleDateApply} className="h-9">
                                            Apply
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Payment method */}
                            <Select value={paymentMethod} onValueChange={handleMethodChange}>
                                <SelectTrigger className="h-9 w-[160px]">
                                    <SelectValue placeholder="All Methods" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    {paymentMethods.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Per page */}
                            <Select value={perPage} onValueChange={handlePerPageChange}>
                                <SelectTrigger className="h-9 w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PER_PAGE_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Reset */}
                            {hasFilters && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleReset}
                                    className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                                >
                                    <FilterXIcon className="h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Active filter badges */}
                        {hasFilters && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {search && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Search: <span className="font-medium">{search}</span>
                                    </Badge>
                                )}
                                {period && period !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Period: <span className="font-medium">{PERIOD_OPTIONS.find((o) => o.value === period)?.label}</span>
                                    </Badge>
                                )}
                                {dateFrom && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        From: <span className="font-medium">{dateFrom}</span>
                                    </Badge>
                                )}
                                {dateTo && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        To: <span className="font-medium">{dateTo}</span>
                                    </Badge>
                                )}
                                {paymentMethod && paymentMethod !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Method: <span className="font-medium">{paymentMethod}</span>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── DataTable ─────────────────────────────────────────── */}
                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Receipt Ledger
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">
                                {payments.total} record{payments.total !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {payments.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No payments found</AlertTitle>
                                    <AlertDescription>
                                        No payments match the current filter criteria or have been recorded yet.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {/* Sortable: Receipt # */}
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                                                onClick={() => handleSort('receipt_number')}
                                            >
                                                Receipt #
                                                <SortIcon column="receipt_number" active={sortBy} dir={sortDir} />
                                            </TableHead>

                                            <TableHead>Deceased</TableHead>
                                            <TableHead>Invoice</TableHead>

                                            {/* Sortable: Method */}
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                                                onClick={() => handleSort('payment_method')}
                                            >
                                                Method
                                                <SortIcon column="payment_method" active={sortBy} dir={sortDir} />
                                            </TableHead>

                                            <TableHead>Reference</TableHead>

                                            {/* Sortable: Date */}
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                                                onClick={() => handleSort('payment_date')}
                                            >
                                                Date
                                                <SortIcon column="payment_date" active={sortBy} dir={sortDir} />
                                            </TableHead>

                                            {/* Sortable: Amount */}
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap text-right hover:text-foreground"
                                                onClick={() => handleSort('amount')}
                                            >
                                                Amount
                                                <SortIcon column="amount" active={sortBy} dir={sortDir} />
                                            </TableHead>

                                            <TableHead className="w-20 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.data.map((payment) => (
                                            <TableRow key={payment.id} className="group">
                                                {/* Receipt */}
                                                <TableCell className="font-mono text-sm font-semibold text-foreground">
                                                    {payment.receipt_number}
                                                </TableCell>

                                                {/* Deceased */}
                                                <TableCell className="font-medium text-foreground">
                                                    {payment.deceased ? (
                                                        <Link
                                                            href={`/deceased/${payment.deceased.id}`}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {payment.deceased.first_name} {payment.deceased.last_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Invoice */}
                                                <TableCell>
                                                    {payment.invoice ? (
                                                        <Link
                                                            href={`/invoices/${payment.invoice.id}`}
                                                            className="text-sm text-primary hover:underline"
                                                        >
                                                            {payment.invoice.invoice_number}
                                                        </Link>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                                                            Deposit
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Method */}
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-xs font-medium text-foreground">
                                                        {payment.payment_method}
                                                    </span>
                                                </TableCell>

                                                {/* Reference */}
                                                <TableCell className="max-w-[110px] truncate font-mono text-xs text-muted-foreground">
                                                    {payment.transaction_reference || '—'}
                                                </TableCell>

                                                {/* Date */}
                                                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                    {new Date(payment.payment_date).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </TableCell>

                                                {/* Amount */}
                                                <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                    {fmtCurrency(parseFloat(payment.amount as string), symbol)}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                        className="opacity-0 transition-opacity group-hover:opacity-100"
                                                    >
                                                        <Link href={`/payments/${payment.id}`}>
                                                            <EyeIcon className="h-4 w-4" />
                                                            <span className="sr-only">View</span>
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {payments.last_page > 1 && (
                            <div className="border-t border-border px-6 py-4">
                                <Pagination links={payments.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [{ title: 'Payments', href: '/payments' }],
};
