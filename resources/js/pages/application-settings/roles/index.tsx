import { useState, FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationLink } from '@/components/pagination';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Search, Plus, PencilIcon, TrashIcon, Shield } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions_count: number;
    users_count: number;
    created_at: string;
}

interface Props {
    roles: {
        data: Role[];
        links: PaginationLink[];
        total: number;
        from: number;
        to: number;
    };
    filters: { search?: string };
    can: { manage: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Roles', href: '/settings/application-settings/roles' },
];

export default function RolesIndex({ roles, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/settings/application-settings/roles', { search }, {
            preserveState: true,
            replace: true,
        });
    };

    function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/settings/application-settings/roles/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="Roles & Permissions" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Roles & Permissions</h1>
                        {roles.total > 0 && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Showing {roles.from}–{roles.to} of {roles.total} roles
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Search roles..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            <Button type="submit" variant="secondary" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        {can.manage && (
                            <Button asChild>
                                <Link href="/settings/application-settings/roles/create">
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    New Role
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Users Assigned</TableHead>
                                <TableHead>Created</TableHead>
                                {can.manage && (
                                    <TableHead className="w-24 text-right">Actions</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={can.manage ? 5 : 4} className="py-8 text-center text-muted-foreground">
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.data.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium capitalize">
                                            {role.name}
                                            {role.name === 'super admin' && (
                                                <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-destructive border border-destructive/20 uppercase">
                                                    System
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                                <Shield className="h-3 w-3" />
                                                {role.permissions_count} rules
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground">
                                                {role.users_count} {role.users_count === 1 ? 'user' : 'users'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(role.created_at).toLocaleDateString()}
                                        </TableCell>
                                        {can.manage && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/settings/application-settings/roles/${role.id}/edit`}>
                                                            <PencilIcon className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive disabled:opacity-50"
                                                        onClick={() => setDeleteTarget(role)}
                                                        disabled={role.name === 'super admin' || role.users_count > 0}
                                                        title={
                                                            role.name === 'super admin'
                                                                ? 'Cannot delete system role'
                                                                : role.users_count > 0
                                                                ? 'Cannot delete role with assigned users'
                                                                : 'Delete role'
                                                        }
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Pagination links={roles.links} />
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Role"
                description={`Are you sure you want to delete the "${deleteTarget?.name}" role?`}
                confirmLabel="Delete Role"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

RolesIndex.layout = { breadcrumbs };
