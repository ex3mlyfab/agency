import { Head, Link, router } from '@inertiajs/react';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Pagination } from '@/components/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface ServicePrice {
    id: string;
    price: string;
    source?: string | null;
    service: {
        id: string;
        name: string;
    } | null;
    service_category?: {
        id: string;
        name: string;
    } | null;
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

interface Props {
    servicePrices: PaginatedServicePrices;
    can: { manage: boolean };
}

export default function ServicePricesIndex({ servicePrices, can }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/service-prices/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

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
                                            <TableHead>Service</TableHead>
                                            <TableHead>Service Category</TableHead>
                                            <TableHead>Applicable Source</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="w-24 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {servicePrices.data.map((item) => {
                                            // Handle both possible casing of relationship serialization
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
                                                        ₦{parseFloat(item.price).toFixed(2)}
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
