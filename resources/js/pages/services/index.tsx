import { Head, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    SearchIcon,
    XIcon,
    FilterIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
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
import { Pagination } from '@/components/pagination';

interface Service {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

interface PaginatedServices {
    data: Service[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    services: PaginatedServices;
    filters: {
        search: string;
        sort: string;
    };
    can: { manage: boolean };
}

export default function ServicesIndex({ services, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'name_asc');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    function applyFilters() {
        router.get(
            '/services',
            {
                search: search || undefined,
                sort: sort || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['services', 'filters'],
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setSort('name_asc');
        router.get('/services', {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['services', 'filters'],
        });
    }

    function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/services/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    function hasActiveFilters() {
        return !!(search || sort !== 'name_asc');
    }

    function getSortLabel(currentSort: string): string {
        switch (currentSort) {
            case 'name_desc': return 'Name (Z–A)';
            case 'newest': return 'Newest first';
            case 'oldest': return 'Oldest first';
            default: return 'Name (A–Z)';
        }
    }

    const total = services.total ?? 0;

    return (
        <>
            <Head title="Service List" />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Service List
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {total > 0
                                ? `Showing ${services.from}–${services.to} of ${services.total} services`
                                : 'No services configured'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild className="shrink-0">
                            <Link href="/services/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Service
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Filters Card */}
                <Card>
                    <CardContent className="p-0">
                        {/* Top row: search + toggle */}
                        <div className="flex items-center gap-2 border-b border-border p-3">
                            <div className="relative flex-1 min-w-0">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search services by name…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 pr-9"
                                    aria-label="Search services"
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
                                    <Label htmlFor="sort-filter" className="text-xs font-medium text-muted-foreground">
                                        Sort
                                    </Label>
                                    <Select value={sort} onValueChange={setSort}>
                                        <SelectTrigger id="sort-filter" className="w-[160px]">
                                            <SelectValue placeholder="Name (A–Z)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                                            <SelectItem value="name_desc">Name (Z–A)</SelectItem>
                                            <SelectItem value="newest">Newest first</SelectItem>
                                            <SelectItem value="oldest">Oldest first</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                "{search}"
                                <button
                                    onClick={() => { setSearch(''); applyFilters(); }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove search filter"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {sort !== 'name_asc' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {getSortLabel(sort)}
                                <button
                                    onClick={() => { setSort('name_asc'); applyFilters(); }}
                                    className="ml-1.5 hover:text-destructive"
                                    aria-label="Remove sort filter"
                                >
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
                            Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {services.data.length === 0 ? (
                            <div className="p-8">
                                <Alert>
                                    <AlertTitle>No services found</AlertTitle>
                                    <AlertDescription>
                                        {hasActiveFilters()
                                            ? 'No services match your current filters.'
                                            : 'No services have been added yet.'}
                                        {can.manage && !hasActiveFilters() && (
                                            <Link
                                                href="/services/create"
                                                className="ml-1 font-semibold underline underline-offset-4"
                                            >
                                                Add the first service.
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
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="w-24 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.data.map((service, index) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="text-muted-foreground font-mono text-xs">
                                                    {services.from + index}
                                                </TableCell>
                                                <TableCell className="font-medium text-foreground">
                                                    {service.name}
                                                </TableCell>
                                                <TableCell className="max-w-xs text-muted-foreground text-xs">
                                                    <div className="line-clamp-2">
                                                        {service.description || '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                                    {new Date(service.created_at).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {can.manage && (
                                                            <>
                                                                <Button asChild variant="ghost" size="sm">
                                                                    <Link href={`/services/${service.id}/edit`}>
                                                                        <PencilIcon className="h-4 w-4" />
                                                                        <span className="sr-only">Edit</span>
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => setDeleteTarget(service.id)}
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                    <span className="sr-only">Delete</span>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Mobile card list */}
                                <div className="sm:hidden divide-y divide-border">
                                    {services.data.map((service, index) => (
                                        <div key={service.id} className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">{service.name}</p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        #{services.from + index} ·{' '}
                                                        {new Date(service.created_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            {service.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {service.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                                                {can.manage && (
                                                    <>
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/services/${service.id}/edit`}>
                                                                <PencilIcon className="h-4 w-4 mr-1.5" />
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(service.id)}
                                                        >
                                                            <TrashIcon className="h-4 w-4 mr-1.5" />
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {services.last_page > 1 && (
                                    <div className="border-t border-border px-4 py-3 sm:px-6">
                                        <Pagination links={services.links} />
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
                title="Delete Service"
                description="This action cannot be undone. Any service prices linked to this service must be deleted first."
                confirmLabel="Delete Service"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

ServicesIndex.layout = {
    breadcrumbs: [{ title: 'Service List', href: '/services' }],
};
