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

interface Service {
    id: string;
    name: string;
    description: string | null;
}

interface PaginatedServices {
    data: Service[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: any[];
}

interface Props {
    services: PaginatedServices;
    can: { manage: boolean };
}

export default function ServicesIndex({ services, can }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/services/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="Service List" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Service List
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {services.total > 0
                                ? `Showing ${services.from}–${services.to} of ${services.total} services`
                                : 'No services configured'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild>
                            <Link href="/services/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Service
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {services.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No services yet</AlertTitle>
                                    <AlertDescription>
                                        No services have been added to the register.{' '}
                                        {can.manage && (
                                            <Link
                                                href="/services/create"
                                                className="font-semibold underline underline-offset-4"
                                            >
                                                Add the first service.
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
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="w-24 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.data.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="font-medium text-foreground">
                                                    {service.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {service.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
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
                            </div>
                        )}

                        {services.last_page > 1 && (
                            <div className="border-t border-border px-6 py-4">
                                <Pagination links={services.links} />
                            </div>
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
