import { Head, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    SearchIcon,
    XIcon,
    FilterIcon,
    CalendarIcon,
    UserIcon,
    BuildingIcon,
    ClockIcon,
    ScaleIcon,
    CheckCircleIcon,
    AlertCircleIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusChip } from '@/components/status-chip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface Deceased {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    date_of_death: string;
    gender: string;
    status: 'Pending' | 'InChamber' | 'Released';
    chamber: { name: string } | null;
    relative_name: string;
    picture: string | null;
    body_tag_number: string | null;
    service_category: { name: string } | null;
    days_in_storage: number;
}

interface PaginatedDeceased {
    data: Deceased[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    deceased: PaginatedDeceased;
    stats: {
        total: number;
        pending: number;
        in_chamber: number;
        released: number;
        avg_days_in_storage: number | null;
    };
    serviceCategories: { id: string; name: string }[];
    genders: string[];
    filters: {
        search: string;
        status: string;
        service_category_id: string;
        date_from: string;
        date_to: string;
    };
    can: { create: boolean; edit: boolean; delete: boolean };
}

function formatAge(dateOfBirth: string | null): string {
    if (!dateOfBirth) {
return '—';
}

    const birth = new Date(dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years > 0) {
return `${years}y ${months}m ${days}d`;
}

    if (months > 0) {
return `${months}m ${days}d`;
}

    return `${days}d`;
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

export default function DeceasedIndex({ deceased, stats, serviceCategories, genders, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [serviceCategoryId, setServiceCategoryId] = useState(filters.service_category_id ?? 'all');
    const [gender, setGender] = useState(filters.gender ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    function applyFilters() {
        router.get(
            '/deceased',
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
                service_category_id: serviceCategoryId === 'all' ? undefined : serviceCategoryId,
                gender: gender === 'all' ? undefined : gender,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['deceased', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setStatus('all');
        setServiceCategoryId('all');
        setGender('all');
        setDateFrom('');
        setDateTo('');
        router.get('/deceased', {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['deceased', 'filters'],
        });
    }

    function handleDelete() {
        if (!deleteTarget) {
return;
}

        setIsDeleting(true);
        router.delete(`/deceased/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    function hasActiveFilters() {
        return !!(
            search ||
            status !== 'all' ||
            serviceCategoryId !== 'all' ||
            gender !== 'all' ||
            dateFrom ||
            dateTo
        );
    }

    const pending = stats.pending ?? 0;
    const inChamber = stats.in_chamber ?? 0;
    const released = stats.released ?? 0;
    const total = stats.total ?? 0;
    const avgDays = stats.avg_days_in_storage ?? 0;

    return (
        <>
            <Head title="Deceased Register" />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Deceased Register
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {total > 0
                                ? `Showing ${deceased.from}–${deceased.to} of ${deceased.total} records`
                                : 'No records on file'}
                        </p>
                    </div>
                    {can.create && (
                        <Button asChild className="shrink-0">
                            <Link href="/deceased/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                New Record
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
                                <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {total}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Total Records
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                <AlertCircleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {pending}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Pending
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                <BuildingIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {inChamber}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    In Chamber
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-500/10">
                                <CheckCircleIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {released}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Released
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-2 overflow-hidden lg:col-span-1">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-violet-500" />
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                <ClockIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none truncate">
                                    {avgDays > 0 ? Math.round(avgDays) : '—'}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Avg Days Stored
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
                                    placeholder="Search by name, tag number, or relative…"
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
                                filtersOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="flex flex-wrap items-end gap-3 p-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">
                                        Status
                                    </Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger id="status-filter" className="w-[130px]">
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All statuses</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="InChamber">In Chamber</SelectItem>
                                            <SelectItem value="Released">Released</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="gender-filter" className="text-xs font-medium text-muted-foreground">
                                        Gender
                                    </Label>
                                    <Select value={gender} onValueChange={setGender}>
                                        <SelectTrigger id="gender-filter" className="w-[120px]">
                                            <SelectValue placeholder="All genders" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All genders</SelectItem>
                                            {genders.map((g) => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="category-filter" className="text-xs font-medium text-muted-foreground">
                                        Category
                                    </Label>
                                    <Select value={serviceCategoryId} onValueChange={setServiceCategoryId}>
                                        <SelectTrigger id="category-filter" className="w-[150px]">
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All categories</SelectItem>
                                            {serviceCategories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
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
                        {status !== 'all' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                Status: {status}
                                <button onClick={() => {
 setStatus('all'); applyFilters(); 
}} className="ml-1.5 hover:text-destructive" aria-label="Remove status filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {serviceCategoryId !== 'all' && serviceCategories.find(c => c.id === serviceCategoryId)?.name && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {serviceCategories.find(c => c.id === serviceCategoryId)?.name}
                                <button onClick={() => {
 setServiceCategoryId('all'); applyFilters(); 
}} className="ml-1.5 hover:text-destructive" aria-label="Remove category filter">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {gender !== 'all' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {gender}
                                <button onClick={() => {
 setGender('all'); applyFilters(); 
}} className="ml-1.5 hover:text-destructive" aria-label="Remove gender filter">
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
                            Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {deceased.data.length === 0 ? (
                            <div className="p-8">
                                <Alert>
                                    <AlertTitle>No records found</AlertTitle>
                                    <AlertDescription>
                                        {hasActiveFilters()
                                            ? 'No deceased records match your current filters.'
                                            : 'No deceased records have been added yet.'}
                                        {can.create && !hasActiveFilters() && (
                                            <Link
                                                href="/deceased/create"
                                                className="ml-1 font-semibold underline underline-offset-4"
                                            >
                                                Add the first record.
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
                                            <TableHead className="w-16">Photo</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Tag #</TableHead>
                                            <TableHead>Age</TableHead>
                                            <TableHead>Gender</TableHead>
                                            <TableHead>Date of Death</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Chamber</TableHead>
                                            <TableHead>Days Stored</TableHead>
                                            <TableHead>Relative</TableHead>
                                            <TableHead className="text-right w-28">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deceased.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={record.picture ? `/storage/${record.picture}` : undefined}
                                                            alt={`${record.first_name} ${record.last_name}`}
                                                        />
                                                        <AvatarFallback className="text-[10px]">
                                                            {record.first_name[0]}{record.last_name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="font-medium max-w-[160px]">
                                                    <div className="truncate">{record.first_name} {record.last_name}</div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs">
                                                    {record.body_tag_number ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {formatAge(record.date_of_birth)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {record.gender}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                                    {formatDate(record.date_of_death)}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusChip status={record.status} />
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {record.service_category?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs max-w-[120px]">
                                                    <div className="truncate" title={record.chamber?.name ?? ''}>
                                                        {record.chamber?.name ?? '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {record.days_in_storage > 0 ? `${record.days_in_storage}d` : '—'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs max-w-[140px]">
                                                    <div className="truncate" title={record.relative_name}>
                                                        {record.relative_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/deceased/${record.id}`}>
                                                                <EyeIcon className="h-4 w-4" />
                                                                <span className="sr-only">View</span>
                                                            </Link>
                                                        </Button>
                                                        {can.edit && (
                                                            <Button asChild variant="ghost" size="sm">
                                                                <Link href={`/deceased/${record.id}/edit`}>
                                                                    <PencilIcon className="h-4 w-4" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {can.delete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => setDeleteTarget(record.id)}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Mobile card list */}
                                <div className="sm:hidden divide-y divide-border">
                                    {deceased.data.map((record) => (
                                        <div key={record.id} className="p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 shrink-0">
                                                    <AvatarImage
                                                        src={record.picture ? `/storage/${record.picture}` : undefined}
                                                        alt=""
                                                    />
                                                    <AvatarFallback>
                                                        {record.first_name[0]}{record.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">
                                                        {record.first_name} {record.last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Tag #{record.body_tag_number ?? '—'} · {record.gender} · {formatAge(record.date_of_birth)}
                                                    </p>
                                                </div>
                                                <StatusChip status={record.status} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground">Date of Death:</span>
                                                    <p className="font-medium">{formatDate(record.date_of_death)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Category:</span>
                                                    <p className="font-medium">{record.service_category?.name ?? '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Chamber:</span>
                                                    <p className="font-medium">{record.chamber?.name ?? '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Days Stored:</span>
                                                    <p className="font-medium">{record.days_in_storage > 0 ? `${record.days_in_storage}d` : '—'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground">Relative:</span>
                                                    <p className="font-medium">{record.relative_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/deceased/${record.id}`}>
                                                        <EyeIcon className="h-4 w-4 mr-1.5" />
                                                        View
                                                    </Link>
                                                </Button>
                                                {can.edit && (
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/deceased/${record.id}/edit`}>
                                                            <PencilIcon className="h-4 w-4 mr-1.5" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                )}
                                                {can.delete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(record.id)}
                                                    >
                                                        <TrashIcon className="h-4 w-4 mr-1.5" />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {deceased.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-6">
                                        <span className="text-xs text-muted-foreground">
                                            Page {deceased.current_page} of {deceased.last_page}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {deceased.links.map((link) => (
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

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete deceased record"
                description="This action cannot be undone. The deceased record and all associated history will be permanently removed."
                confirmLabel="Delete Record"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

DeceasedIndex.layout = {
    breadcrumbs: [{ title: 'Deceased', href: '/deceased' }],
};
