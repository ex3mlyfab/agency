import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowUpDownIcon,
    FilterXIcon,
    PencilIcon,
    PlusIcon,
    SearchIcon,
    TrashIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
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

interface SimpleItem {
    id: string;
    name: string;
}

interface ServicePrice {
    id: string;
    price: string;
    source?: string | null;
    service: SimpleItem | null;
    service_category?: SimpleItem | null;
    service_category_id?: string;
}

interface PaginatedServicePrices {
    data: ServicePrice[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: any[];
}

interface Filters {
    search?: string;
    service_id?: string;
    service_category_id?: string;
    per_page?: string;
    sort_by?: string;
    sort_dir?: string;
}

interface Props {
    servicePrices: PaginatedServicePrices;
    services: SimpleItem[];
    serviceCategories: SimpleItem[];
    filters: Filters;
    can: { manage: boolean };
}

const PER_PAGE_OPTIONS = [
    { value: '15', label: '15 / page' },
    { value: '25', label: '25 / page' },
    { value: '50', label: '50 / page' },
];

type SortKey = 'service' | 'category' | 'source' | 'price' | 'created_at';

function SortIcon({ column, active, dir }: { column: SortKey; active: SortKey; dir: string }) {
    if (column !== active) {
return <ArrowUpDownIcon className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/50" />;
}

    return dir === 'asc'
        ? <ArrowUpIcon className="ml-1 inline h-3.5 w-3.5 text-primary" />
        : <ArrowDownIcon className="ml-1 inline h-3.5 w-3.5 text-primary" />;
}

export default function ServicePricesIndex({ servicePrices, services, serviceCategories, filters = {}, can }: Props) {
    const symbol = useCurrency();
    const [search, setSearch] = useState(filters.search ?? '');
    const [serviceId, setServiceId] = useState(filters.service_id ?? 'all');
    const [serviceCategoryId, setServiceCategoryId] = useState(filters.service_category_id ?? 'all');
    const [perPage, setPerPage] = useState(filters.per_page ?? '15');
    const [sortBy, setSortBy] = useState<SortKey>((filters.sort_by as SortKey) ?? 'created_at');
    const [sortDir, setSortDir] = useState(filters.sort_dir ?? 'desc');

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const applyFilters = useCallback(
        (overrides: Partial<Filters> = {}) => {
            const params: Record<string, string> = {};
            const s = overrides.search ?? search;
            const sid = overrides.service_id ?? serviceId;
            const scid = overrides.service_category_id ?? serviceCategoryId;
            const pp = overrides.per_page ?? perPage;
            const sb = overrides.sort_by ?? sortBy;
            const sd = overrides.sort_dir ?? sortDir;

            if (s) {
params.search = s;
}

            if (sid && sid !== 'all') {
params.service_id = sid;
}

            if (scid && scid !== 'all') {
params.service_category_id = scid;
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

            router.get('/service-prices', params, { preserveState: true, replace: true });
        },
        [search, serviceId, serviceCategoryId, perPage, sortBy, sortDir],
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

    function handleServiceChange(val: string) {
        setServiceId(val);
        applyFilters({ service_id: val });
    }

    function handleCategoryChange(val: string) {
        setServiceCategoryId(val);
        applyFilters({ service_category_id: val });
    }

    function handlePerPageChange(val: string) {
        setPerPage(val);
        applyFilters({ per_page: val });
    }

    function handleReset() {
        setSearch('');
        setServiceId('all');
        setServiceCategoryId('all');
        setPerPage('15');
        setSortBy('created_at');
        setSortDir('desc');
        router.get('/service-prices', {}, { preserveState: true, replace: true });
    }

    function handleDelete() {
        if (!deleteTarget) {
return;
}

        setIsDeleting(true);
        router.delete(`/service-prices/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    const hasFilters = search || (serviceId && serviceId !== 'all') || (serviceCategoryId && serviceCategoryId !== 'all');

    return (
        <>
            <Head title="Service Prices" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Service Prices
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {servicePrices.total > 0
                                ? `Showing ${servicePrices.from}–${servicePrices.to} of ${servicePrices.total} price configurations`
                                : 'No price configurations found'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild>
                            <Link href="/service-prices/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Price Config
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Filter Bar */}
                <Card className="border-border/60">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Search */}
                            <div className="relative min-w-[200px] flex-1">
                                <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by service, category or source…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 pl-8"
                                />
                            </div>

                            {/* Service select */}
                            <Select value={serviceId} onValueChange={handleServiceChange}>
                                <SelectTrigger className="h-9 w-[180px]">
                                    <SelectValue placeholder="All Services" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    {services?.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Category select */}
                            <Select value={serviceCategoryId} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="h-9 w-[180px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {serviceCategories?.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                                {serviceId && serviceId !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Service: <span className="font-medium">{services?.find(s => s.id === serviceId)?.name}</span>
                                    </Badge>
                                )}
                                {serviceCategoryId && serviceCategoryId !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        Category: <span className="font-medium">{serviceCategories?.find(c => c.id === serviceCategoryId)?.name}</span>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Price List
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {servicePrices.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No prices configured yet</AlertTitle>
                                    <AlertDescription>
                                        No pricing matrix configured.{' '}
                                        {can.manage && (
                                            <Link
                                                href="/service-prices/create"
                                                className="font-semibold underline underline-offset-4"
                                            >
                                                Configure the first price.
                                            </Link>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                                                onClick={() => handleSort('service')}
                                            >
                                                Service
                                                <SortIcon column="service" active={sortBy} dir={sortDir} />
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                                                onClick={() => handleSort('category')}
                                            >
                                                Service Category
                                                <SortIcon column="category" active={sortBy} dir={sortDir} />
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                                                onClick={() => handleSort('source')}
                                            >
                                                Applicable Source
                                                <SortIcon column="source" active={sortBy} dir={sortDir} />
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                                                onClick={() => handleSort('price')}
                                            >
                                                Price
                                                <SortIcon column="price" active={sortBy} dir={sortDir} />
                                            </TableHead>
                                            <TableHead className="w-24 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {servicePrices.data.map((item) => {
                                            const category = item.service_category || (item as any).serviceCategory;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium text-foreground">
                                                        {item.service?.name || 'Unknown Service'}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {category?.name || 'Unknown Category'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.source || 'All Sources'}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-success">
                                                        {fmtCurrency(parseFloat(item.price), symbol)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.manage && (
                                                                <>
                                                                    <Button asChild variant="ghost" size="sm">
                                                                        <Link href={`/service-prices/${item.id}/edit`}>
                                                                            <PencilIcon className="h-4 w-4" />
                                                                            <span className="sr-only">Edit</span>
                                                                        </Link>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-destructive hover:text-destructive"
                                                                        onClick={() => setDeleteTarget(item.id)}
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                        <span className="sr-only">Delete</span>
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {servicePrices.last_page > 1 && (
                            <div className="border-t border-border px-6 py-4">
                                <Pagination links={servicePrices.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Price Configuration"
                description="This action cannot be undone. This pricing configuration will be permanently deleted."
                confirmLabel="Delete Price"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

ServicePricesIndex.layout = {
    breadcrumbs: [{ title: 'Service Prices', href: '/service-prices' }],
};
