import { Head, Link, router } from '@inertiajs/react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusChip } from '@/components/status-chip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Deceased {
    id: number;
    first_name: string;
    last_name: string;
    date_of_death: string;
    gender: string;
    status: 'Pending' | 'InChamber' | 'Released';
    chamber: { name: string } | null;
    relative_name: string;
    picture: string | null;
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
    can: { create: boolean; edit: boolean; delete: boolean };
}

export default function DeceasedIndex({ deceased, can }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/deceased/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="Deceased Register" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Deceased Register
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {deceased.total > 0
                                ? `Showing ${deceased.from}–${deceased.to} of ${deceased.total} records`
                                : 'No records on file'}
                        </p>
                    </div>
                    {can.create && (
                        <Button asChild>
                            <Link href="/deceased/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                New Record
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {deceased.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No records yet</AlertTitle>
                                    <AlertDescription>
                                        No deceased records have been added.{' '}
                                        {can.create && (
                                            <Link
                                                href="/deceased/create"
                                                className="font-semibold underline underline-offset-4"
                                            >
                                                Add the first record.
                                            </Link>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Picture</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Date of Death</TableHead>
                                        <TableHead>Gender</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Chamber</TableHead>
                                        <TableHead>Relative</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deceased.data.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage
                                                        src={record.picture ? `/storage/${record.picture}` : undefined}
                                                        alt={`${record.first_name} ${record.last_name}`}
                                                    />
                                                    <AvatarFallback>
                                                        {record.first_name[0]}
                                                        {record.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {record.first_name} {record.last_name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {record.date_of_death}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {record.gender}
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={record.status} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {record.chamber?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {record.relative_name}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Link href={`/deceased/${record.id}`}>
                                                            <EyeIcon className="h-4 w-4" />
                                                            <span className="sr-only">View</span>
                                                        </Link>
                                                    </Button>
                                                    {can.edit && (
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={`/deceased/${record.id}/edit`}
                                                            >
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
                                                            onClick={() =>
                                                                setDeleteTarget(record.id)
                                                            }
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
                        )}

                        {/* Pagination */}
                        {deceased.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-6 py-4">
                                <span className="text-sm text-muted-foreground">
                                    Page {deceased.current_page} of {deceased.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {deceased.links.map((link) => (
                                        <Button
                                            key={link.label}
                                            asChild={!!link.url}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>
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
