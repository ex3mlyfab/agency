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

interface ServiceCategory {
    id: string;
    name: string;
    description: string | null;
}

interface PaginatedServiceCategories {
    data: ServiceCategory[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: any[];
}

interface Props {
    serviceCategories: PaginatedServiceCategories;
    can: { manage: boolean };
}

export default function ServiceCategoriesIndex({ serviceCategories, can }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDelete() {
        if (!deleteTarget) {
return;
}

        setIsDeleting(true);
        router.delete(`/service-categories/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="Service Categories" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Service Categories
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {serviceCategories.total > 0
                                ? `Showing ${serviceCategories.from}â€“${serviceCategories.to} of ${serviceCategories.total} categories`
                                : 'No categories configured'}
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild>
                            <Link href="/service-categories/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Category
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border px-6 py-3">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {serviceCategories.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No categories yet</AlertTitle>
                                    <AlertDescription>
                                        No service categories have been configured.{' '}
                                        {can.manage && (
                                            <Link
                                                href="/service-categories/create"
                                                className="font-semibold underline underline-offset-4"
                                            >
                                                Add the first category.
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
                                        {serviceCategories.data.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell className="font-medium text-foreground">
                                                    {category.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {category.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {can.manage && (
                                                            <>
                                                                <Button asChild variant="ghost" size="sm">
                                                                    <Link href={`/service-categories/${category.id}/edit`}>
                                                                        <PencilIcon className="h-4 w-4" />
                                                                        <span className="sr-only">Edit</span>
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => setDeleteTarget(category.id)}
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

                        {serviceCategories.last_page > 1 && (
                            <div className="border-t border-border px-6 py-3">
                                <Pagination links={serviceCategories.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Service Category"
                description="This action cannot be undone. Any service prices linked to this category must be deleted first."
                confirmLabel="Delete Category"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

ServiceCategoriesIndex.layout = {
    breadcrumbs: [{ title: 'Service Categories', href: '/service-categories' }],
};
